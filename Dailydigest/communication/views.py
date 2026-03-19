from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from django.utils import timezone
import cloudinary.uploader

from .models import SocialPost


def _image_url(post):
    """Retourne l'URL Cloudinary de l'image ou None."""
    if post.image:
        return post.image.url if hasattr(post.image, 'url') else str(post.image)
    return None


@api_view(['GET'])
@permission_classes([IsAdminUser])
def social_posts_list(request):
    """Liste tous les posts avec filtres optionnels."""
    posts = SocialPost.objects.all()

    # Filtres
    month = request.query_params.get('month')
    platform = request.query_params.get('platform')
    status = request.query_params.get('status')
    post_type = request.query_params.get('type')

    if month:
        posts = posts.filter(month=month)
    if platform:
        posts = posts.filter(platform=platform)
    if status:
        posts = posts.filter(status=status)
    if post_type:
        posts = posts.filter(post_type=post_type)

    return Response([
        {
            "id": p.id,
            "day": p.day,
            "date_label": p.date_label,
            "month": p.month,
            "platform": p.platform,
            "post_type": p.post_type,
            "text": p.text,
            "hashtags": p.hashtags,
            "image_description": p.image_description,
            "cta": p.cta,
            "objective": p.objective,
            "status": p.status,
            "scheduled_date": p.scheduled_date.isoformat() if p.scheduled_date else None,
            "published_at": p.published_at.isoformat() if p.published_at else None,
            "image_url": _image_url(p),
        }
        for p in posts
    ])


@api_view(['GET'])
@permission_classes([IsAdminUser])
def social_posts_calendar(request):
    """Posts groupes par jour pour la vue calendrier."""
    month = request.query_params.get('month', '1')
    posts = SocialPost.objects.filter(month=month).order_by('day', 'platform')

    calendar = {}
    for p in posts:
        if p.day not in calendar:
            calendar[p.day] = {
                "day": p.day,
                "date_label": p.date_label,
                "posts": [],
            }
        calendar[p.day]["posts"].append({
            "id": p.id,
            "platform": p.platform,
            "post_type": p.post_type,
            "text": p.text[:120] + "..." if len(p.text) > 120 else p.text,
            "status": p.status,
            "hashtags": p.hashtags,
            "cta": p.cta,
            "image_url": _image_url(p),
        })

    return Response(sorted(calendar.values(), key=lambda x: x["day"]))


@api_view(['GET'])
@permission_classes([IsAdminUser])
def social_post_detail(request, post_id):
    """Detail complet d'un post."""
    try:
        p = SocialPost.objects.get(id=post_id)
    except SocialPost.DoesNotExist:
        return Response({"error": "Post introuvable."}, status=404)

    return Response({
        "id": p.id,
        "day": p.day,
        "date_label": p.date_label,
        "month": p.month,
        "platform": p.platform,
        "post_type": p.post_type,
        "text": p.text,
        "hashtags": p.hashtags,
        "image_description": p.image_description,
        "cta": p.cta,
        "objective": p.objective,
        "status": p.status,
        "scheduled_date": p.scheduled_date.isoformat() if p.scheduled_date else None,
        "published_at": p.published_at.isoformat() if p.published_at else None,
        "image_url": _image_url(p),
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
@parser_classes([MultiPartParser])
def social_post_upload_image(request, post_id):
    """Upload une image pour un post via Cloudinary."""
    try:
        p = SocialPost.objects.get(id=post_id)
    except SocialPost.DoesNotExist:
        return Response({"error": "Post introuvable."}, status=404)

    image_file = request.FILES.get('image')
    if not image_file:
        return Response({"error": "Aucune image envoyee."}, status=400)

    try:
        result = cloudinary.uploader.upload(
            image_file,
            folder="social_posts",
            public_id=f"post_{post_id}_{p.platform}_day{p.day}",
            overwrite=True,
            resource_type="image",
        )
        p.image = result['public_id']
        p.save(update_fields=['image'])
        return Response({
            "message": "Image uploadee.",
            "image_url": result['secure_url'],
        })
    except Exception as e:
        return Response({"error": f"Erreur upload: {str(e)}"}, status=500)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def social_post_delete_image(request, post_id):
    """Supprime l'image d'un post."""
    try:
        p = SocialPost.objects.get(id=post_id)
    except SocialPost.DoesNotExist:
        return Response({"error": "Post introuvable."}, status=404)

    if p.image:
        try:
            cloudinary.uploader.destroy(str(p.image))
        except Exception:
            pass
        p.image = None
        p.save(update_fields=['image'])

    return Response({"message": "Image supprimee."})


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def social_post_update(request, post_id):
    """Modifier un post (texte, statut, date, etc.)."""
    try:
        p = SocialPost.objects.get(id=post_id)
    except SocialPost.DoesNotExist:
        return Response({"error": "Post introuvable."}, status=404)

    for field in ['text', 'hashtags', 'cta', 'image_description', 'objective',
                  'status', 'scheduled_date', 'platform', 'post_type']:
        if field in request.data:
            setattr(p, field, request.data[field])

    # Si on valide, enregistrer
    if request.data.get('status') == 'publie' and not p.published_at:
        p.published_at = timezone.now()

    p.save()
    return Response({"message": "Post mis a jour.", "id": p.id, "status": p.status})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def social_post_bulk_action(request):
    """Action groupee : valider ou rejeter plusieurs posts."""
    action = request.data.get('action')  # 'valide' ou 'rejete'
    post_ids = request.data.get('ids', [])

    if action not in ('valide', 'rejete'):
        return Response({"error": "Action invalide. Utilisez 'valide' ou 'rejete'."}, status=400)

    updated = SocialPost.objects.filter(id__in=post_ids).update(status=action)
    return Response({"message": f"{updated} posts mis a jour.", "status": action})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def social_posts_stats(request):
    """Statistiques des posts."""
    total = SocialPost.objects.count()
    by_status = {
        "brouillon": SocialPost.objects.filter(status="brouillon").count(),
        "valide": SocialPost.objects.filter(status="valide").count(),
        "publie": SocialPost.objects.filter(status="publie").count(),
        "rejete": SocialPost.objects.filter(status="rejete").count(),
    }
    by_platform = {
        "facebook": SocialPost.objects.filter(platform="facebook").count(),
        "linkedin": SocialPost.objects.filter(platform="linkedin").count(),
        "twitter": SocialPost.objects.filter(platform="twitter").count(),
    }
    by_type = {
        "informatif": SocialPost.objects.filter(post_type="informatif").count(),
        "preuve_sociale": SocialPost.objects.filter(post_type="preuve_sociale").count(),
        "promotionnel": SocialPost.objects.filter(post_type="promotionnel").count(),
    }

    return Response({
        "total": total,
        "by_status": by_status,
        "by_platform": by_platform,
        "by_type": by_type,
    })
