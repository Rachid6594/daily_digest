"""
Pipeline complet de generation de digest :
1. Scrape les sources actives
2. Pre-filtre par mots-cles
3. Tri + resume par IA
4. Cree le Digest en base
5. Envoie l'email
"""
import logging

from django.utils import timezone

from themes.models import Theme, Source
from digests.models import Digest, DigestArticle, PipelineRun
from digests.scraper import scrape_source
from digests.filter import get_filtered_articles
from digests.ranker import rank_and_summarize
from digests.emailer import send_digest_email

logger = logging.getLogger(__name__)


def run_pipeline():
    """Execute le pipeline complet avec suivi en temps reel."""
    run = PipelineRun.objects.create(status="running")
    return _run_pipeline_internal(run)


def run_pipeline_with_run(run_id: int, force: bool = False):
    """Execute le pipeline avec un PipelineRun deja cree."""
    run = PipelineRun.objects.get(id=run_id)
    return _run_pipeline_internal(run, force=force)


def _run_pipeline_internal(run: PipelineRun, force: bool = False):
    """Logique commune d'execution du pipeline."""
    try:
        _execute_pipeline(run, force=force)
        run.status = "completed"
        run.completed_at = timezone.now()
        run.log_step("done", "Pipeline termine avec succes")
        run.save()
    except Exception as e:
        run.status = "failed"
        run.completed_at = timezone.now()
        run.error_message = str(e)[:500]
        run.log_step("error", f"Erreur: {str(e)[:200]}")
        run.save()
        logger.error(f"Pipeline echoue: {e}")

    return run


def _execute_pipeline(run: PipelineRun, force: bool = False):
    """Logique interne du pipeline avec tracking."""

    # ── ETAPE 1 : Identifier les sources ──
    run.log_step("init", f"Identification des sources actives...{' (MODE FORCE)' if force else ''}")

    sources = Source.objects.filter(
        is_active=True,
        themes__is_active=True,
    ).distinct()
    source_list = list(sources)
    run.total_sources = len(source_list)
    run.save(update_fields=["total_sources"])

    run.log_step("scraping", f"Scraping de {len(source_list)} sources...")

    # ── ETAPE 2 : Scraper chaque source ──
    from datetime import timedelta
    cooldown = timezone.now() - timedelta(hours=12)

    for i, source in enumerate(source_list, 1):
        if not force and source.last_scraped and source.last_scraped > cooldown:
            run.log_step(
                "scraping",
                f"Scraping ({i}/{len(source_list)})",
                f"Skip {source.name} (scrape recent)"
            )
            run.scraped_sources = i
            run.save(update_fields=["scraped_sources"])
            continue

        run.log_step(
            "scraping",
            f"Scraping ({i}/{len(source_list)}) : {source.name}",
        )

        result = scrape_source(source)
        run.total_articles_found += result.get("found", 0)
        run.total_articles_new += result.get("added", 0)
        run.scraped_sources = i
        run.save(update_fields=["scraped_sources", "total_articles_found", "total_articles_new"])

        run.log_step(
            "scraping",
            f"Scraping ({i}/{len(source_list)})",
            f"{source.name}: {result['found']} trouves, {result['added']} nouveaux ({result['status']})"
        )

    # ── ETAPE 3 : Generer les digests ──
    themes = list(Theme.objects.filter(is_active=True).select_related("user"))
    run.total_themes = len(themes)
    run.save(update_fields=["total_themes"])

    run.log_step("filtering", f"Traitement de {len(themes)} themes...")

    for i, theme in enumerate(themes, 1):
        run.log_step(
            "processing",
            f"Theme ({i}/{len(themes)}) : {theme.name}",
            f"Utilisateur: {theme.user.email}"
        )
        run.processed_themes = i
        run.save(update_fields=["processed_themes"])

        try:
            digest = _generate_digest_tracked(theme, run, i, len(themes), force=force)
            if digest and digest.status == "ready" and digest.items.exists():
                run.log_step(
                    "emailing",
                    f"Envoi email ({i}/{len(themes)}) : {theme.user.email}",
                )
                send_digest_email(digest)
                run.total_digests_created += 1
                run.save(update_fields=["total_digests_created"])
        except Exception as e:
            run.log_step(
                "processing",
                f"Theme ({i}/{len(themes)}) : {theme.name}",
                f"Erreur: {str(e)[:200]}"
            )
            logger.error(f"Erreur pipeline pour '{theme.name}': {e}")


def _generate_digest_tracked(theme: Theme, run: PipelineRun, idx: int, total: int, force: bool = False) -> Digest | None:
    """Genere un digest avec tracking dans le PipelineRun."""

    # Verifier digest du jour (skip si mode force)
    if not force:
        today = timezone.now().date()
        existing = Digest.objects.filter(theme=theme, created_at__date=today).first()
        if existing:
            run.log_step("processing", f"Theme ({idx}/{total}) : {theme.name}", "Digest deja genere aujourd'hui, skip")
            return existing

    digest = Digest.objects.create(user=theme.user, theme=theme, status="generating")

    try:
        # Filtre mots-cles
        run.log_step("filtering", f"Filtrage mots-cles : {theme.name}")
        filtered = get_filtered_articles(theme)

        if not filtered:
            digest.status = "ready"
            digest.save()
            run.log_step("processing", f"Theme ({idx}/{total}) : {theme.name}", "0 articles apres filtre")
            return digest

        run.log_step("ranking", f"Ranking IA : {theme.name} ({len(filtered)} articles)")

        # Ranking IA
        criteria = theme.filter_criteria if isinstance(theme.filter_criteria, list) else []
        ranked = rank_and_summarize(
            theme_name=theme.name,
            keywords=theme.get_keywords_list(),
            articles=filtered,
            filter_criteria=criteria,
            max_results=10,
        )

        # Creer les DigestArticle
        for position, item in enumerate(ranked, 1):
            DigestArticle.objects.create(
                digest=digest,
                article=item["article"],
                summary=item["summary"],
                relevance_score=item["score"],
                position=position,
            )

        digest.status = "ready"
        digest.save()

        theme.articles_last_digest = len(ranked)
        theme.last_digest_sent = timezone.now()
        theme.save(update_fields=["articles_last_digest", "last_digest_sent"])

        run.log_step(
            "processing",
            f"Theme ({idx}/{total}) : {theme.name}",
            f"Digest pret avec {len(ranked)} articles"
        )
        return digest

    except Exception as e:
        digest.status = "failed"
        digest.error_message = str(e)[:500]
        digest.save()
        raise


# Fonction legacy pour le management command
def generate_digest_for_theme(theme: Theme) -> Digest | None:
    """Genere un digest pour un theme (sans tracking pipeline)."""
    today = timezone.now().date()
    existing = Digest.objects.filter(theme=theme, created_at__date=today).first()
    if existing:
        return existing

    digest = Digest.objects.create(user=theme.user, theme=theme, status="generating")
    try:
        filtered = get_filtered_articles(theme)
        if not filtered:
            digest.status = "ready"
            digest.save()
            return digest

        criteria = theme.filter_criteria if isinstance(theme.filter_criteria, list) else []
        ranked = rank_and_summarize(
            theme_name=theme.name,
            keywords=theme.get_keywords_list(),
            articles=filtered,
            filter_criteria=criteria,
            max_results=10,
        )

        for position, item in enumerate(ranked, 1):
            DigestArticle.objects.create(
                digest=digest, article=item["article"],
                summary=item["summary"], relevance_score=item["score"],
                position=position,
            )

        digest.status = "ready"
        digest.save()
        theme.articles_last_digest = len(ranked)
        theme.last_digest_sent = timezone.now()
        theme.save(update_fields=["articles_last_digest", "last_digest_sent"])
        return digest

    except Exception as e:
        digest.status = "failed"
        digest.error_message = str(e)[:500]
        digest.save()
        return digest
