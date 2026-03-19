from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count
from django.utils import timezone

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats_view(request):
    total_users = User.objects.exclude(is_superuser=True).count()
    active_users = User.objects.filter(is_active=True).exclude(is_superuser=True).count()
    pending_users = User.objects.filter(is_active=False).count()

    total_themes = 0
    total_sources = 0
    total_articles = 0
    total_digests = 0
    total_scrape_jobs = 0

    try:
        from themes.models import Theme, Source
        total_themes = Theme.objects.count()
        total_sources = Source.objects.filter(is_active=True).count()
    except Exception:
        pass

    try:
        from digests.models import Article, Digest, ScrapeJob
        total_articles = Article.objects.count()
        total_digests = Digest.objects.count()
        total_scrape_jobs = ScrapeJob.objects.filter(status="success").count()
    except Exception:
        pass

    total_tokens = 0
    total_ai_calls = 0
    try:
        from digests.models import AIUsageLog
        agg = AIUsageLog.objects.aggregate(
            total_tokens=Sum("total_tokens"),
            total_calls=Count("id"),
        )
        total_tokens = agg["total_tokens"] or 0
        total_ai_calls = agg["total_calls"] or 0
    except Exception:
        pass

    return Response({
        "total_users": total_users,
        "active_users": active_users,
        "pending_users": pending_users,
        "total_themes": total_themes,
        "total_sources": total_sources,
        "total_articles": total_articles,
        "total_digests": total_digests,
        "total_scrape_jobs": total_scrape_jobs,
        "total_tokens": total_tokens,
        "total_ai_calls": total_ai_calls,
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_users_view(request):
    users = User.objects.exclude(is_superuser=True).order_by('-date_joined')[:50]
    data = []
    for u in users:
        theme_count = 0
        try:
            theme_count = u.themes.count()
        except Exception:
            pass
        data.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_active": u.is_active,
            "date_joined": u.date_joined.isoformat(),
            "theme_count": theme_count,
        })
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_themes_view(request):
    from themes.models import Theme
    themes = Theme.objects.select_related('user').prefetch_related('sources').order_by('-created_at')
    return Response([
        {
            "id": t.id,
            "name": t.name,
            "user_email": t.user.email,
            "keywords": t.keywords,
            "is_active": t.is_active,
            "sources_count": t.sources.count(),
            "articles_last_digest": t.articles_last_digest,
            "last_digest_sent": t.last_digest_sent.isoformat() if t.last_digest_sent else None,
            "created_at": t.created_at.isoformat(),
        }
        for t in themes
    ])


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_sources_view(request):
    from themes.models import Source
    sources = Source.objects.filter(is_active=True).order_by('-last_scraped')
    return Response([
        {
            "id": s.id,
            "name": s.name,
            "url": s.url,
            "source_type": s.source_type,
            "themes_count": s.themes.filter(is_active=True).count(),
            "articles_count": s.articles.count(),
            "last_scraped": s.last_scraped.isoformat() if s.last_scraped else None,
            "success_count": s.success_count,
            "error_count": s.error_count,
        }
        for s in sources
    ])


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_digests_view(request):
    from digests.models import Digest
    digests = Digest.objects.select_related('user', 'theme').order_by('-created_at')[:50]
    return Response([
        {
            "id": d.id,
            "user_email": d.user.email,
            "theme_name": d.theme.name,
            "status": d.status,
            "articles_count": d.items.count(),
            "created_at": d.created_at.isoformat(),
            "sent_at": d.sent_at.isoformat() if d.sent_at else None,
        }
        for d in digests
    ])


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_scrape_jobs_view(request):
    from digests.models import ScrapeJob
    jobs = ScrapeJob.objects.select_related('source').order_by('-started_at')[:50]
    return Response([
        {
            "id": j.id,
            "source_name": j.source.name,
            "status": j.status,
            "articles_found": j.articles_found,
            "articles_added": j.articles_added,
            "started_at": j.started_at.isoformat(),
            "completed_at": j.completed_at.isoformat() if j.completed_at else None,
            "error_message": j.error_message[:100] if j.error_message else "",
        }
        for j in jobs
    ])


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_run_pipeline_view(request):
    """Lance le pipeline manuellement."""
    from digests.models import PipelineRun

    # Verifier qu'il n'y a pas deja un pipeline en cours
    running = PipelineRun.objects.filter(status="running").first()
    if running:
        return Response({
            "message": "Un pipeline est deja en cours.",
            "run_id": running.id,
        })

    # Creer le run en avance pour avoir l'ID tout de suite
    run = PipelineRun.objects.create(status="running")

    # Lancer en arriere-plan
    def _run_with_existing(run_id):
        from digests.pipeline import run_pipeline_with_run
        run_pipeline_with_run(run_id)

    try:
        from digests.tasks import run_daily_pipeline
        run_daily_pipeline.delay(run.id)
    except Exception:
        import threading
        thread = threading.Thread(target=_run_with_existing, args=(run.id,), daemon=True)
        thread.start()

    return Response({
        "message": "Pipeline lance.",
        "run_id": run.id,
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_pipeline_status_view(request, run_id=None):
    """Retourne l'etat d'un pipeline en cours ou le dernier."""
    from digests.models import PipelineRun

    if run_id:
        try:
            run = PipelineRun.objects.get(id=run_id)
        except PipelineRun.DoesNotExist:
            return Response({"error": "Run introuvable."}, status=404)
    else:
        run = PipelineRun.objects.order_by("-started_at").first()
        if not run:
            return Response({"status": "idle", "message": "Aucun pipeline execute."})

    return Response({
        "id": run.id,
        "status": run.status,
        "current_step": run.current_step,
        "current_step_label": run.current_step_label,
        "started_at": run.started_at.isoformat(),
        "completed_at": run.completed_at.isoformat() if run.completed_at else None,
        "total_sources": run.total_sources,
        "scraped_sources": run.scraped_sources,
        "total_articles_found": run.total_articles_found,
        "total_articles_new": run.total_articles_new,
        "total_themes": run.total_themes,
        "processed_themes": run.processed_themes,
        "total_digests_created": run.total_digests_created,
        "steps_log": run.steps_log[-20:],  # Derniers 20 logs
        "error_message": run.error_message,
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_curated_sources_view(request):
    """GET: liste les sources curatees. POST: en cree une nouvelle."""
    from themes.models import CuratedSource

    if request.method == 'GET':
        sources = CuratedSource.objects.all()
        return Response([
            {
                "id": s.id,
                "name": s.name,
                "url": s.url,
                "source_type": s.source_type,
                "description": s.description,
                "tags": s.tags,
                "is_active": s.is_active,
                "priority": s.priority,
            }
            for s in sources
        ])

    # POST
    name = request.data.get('name', '').strip()
    url = request.data.get('url', '').strip()
    if not name or not url:
        return Response({"error": "Nom et URL requis."}, status=400)

    source, created = CuratedSource.objects.get_or_create(
        url=url,
        defaults={
            'name': name,
            'source_type': request.data.get('source_type', 'rss'),
            'description': request.data.get('description', ''),
            'tags': request.data.get('tags', []),
            'priority': request.data.get('priority', 0),
        }
    )
    if not created:
        return Response({"error": "Cette URL existe deja."}, status=400)

    return Response({
        "id": source.id, "name": source.name, "url": source.url,
        "message": f"Source '{source.name}' ajoutee."
    }, status=201)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_curated_source_detail_view(request, source_id):
    """PATCH: modifier une source curatee. DELETE: la supprimer."""
    from themes.models import CuratedSource

    try:
        source = CuratedSource.objects.get(id=source_id)
    except CuratedSource.DoesNotExist:
        return Response({"error": "Source introuvable."}, status=404)

    if request.method == 'DELETE':
        source.delete()
        return Response({"message": "Source supprimee."})

    # PATCH
    for field in ['name', 'url', 'source_type', 'description', 'tags', 'is_active', 'priority']:
        if field in request.data:
            setattr(source, field, request.data[field])
    source.save()

    return Response({
        "id": source.id, "name": source.name, "url": source.url,
        "tags": source.tags, "message": "Source mise a jour."
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_ai_usage_view(request):
    """Stats d'usage IA avec logs detailles."""
    from digests.models import AIUsageLog
    from datetime import timedelta

    now = timezone.now()

    # Stats globales
    total = AIUsageLog.objects.aggregate(
        total_tokens=Sum("total_tokens"),
        total_prompt=Sum("prompt_tokens"),
        total_completion=Sum("completion_tokens"),
        total_calls=Count("id"),
    )

    # Stats aujourd'hui
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today = AIUsageLog.objects.filter(created_at__gte=today_start).aggregate(
        tokens=Sum("total_tokens"),
        calls=Count("id"),
    )

    # Stats 7 derniers jours
    week_ago = now - timedelta(days=7)
    week = AIUsageLog.objects.filter(created_at__gte=week_ago).aggregate(
        tokens=Sum("total_tokens"),
        calls=Count("id"),
    )

    # Par feature
    by_feature = list(
        AIUsageLog.objects.values("feature").annotate(
            calls=Count("id"),
            tokens=Sum("total_tokens"),
        ).order_by("-tokens")
    )

    # 50 derniers logs
    logs = AIUsageLog.objects.select_related("user").order_by("-created_at")[:50]
    logs_data = [
        {
            "id": l.id,
            "feature": l.feature,
            "model": l.model,
            "prompt_tokens": l.prompt_tokens,
            "completion_tokens": l.completion_tokens,
            "total_tokens": l.total_tokens,
            "user_email": l.user.email if l.user else None,
            "created_at": l.created_at.isoformat(),
        }
        for l in logs
    ]

    # Limites Groq free tier
    daily_token_limit = 500_000
    daily_request_limit = 14_400

    return Response({
        "total_tokens": total["total_tokens"] or 0,
        "total_prompt_tokens": total["total_prompt"] or 0,
        "total_completion_tokens": total["total_completion"] or 0,
        "total_calls": total["total_calls"] or 0,
        "today_tokens": today["tokens"] or 0,
        "today_calls": today["calls"] or 0,
        "week_tokens": week["tokens"] or 0,
        "week_calls": week["calls"] or 0,
        "daily_token_limit": daily_token_limit,
        "daily_request_limit": daily_request_limit,
        "today_token_pct": round(((today["tokens"] or 0) / daily_token_limit) * 100, 1),
        "today_calls_pct": round(((today["calls"] or 0) / daily_request_limit) * 100, 1),
        "by_feature": by_feature,
        "logs": logs_data,
    })
