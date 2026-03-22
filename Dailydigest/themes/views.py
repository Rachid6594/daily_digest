import json
import logging
import requests as http_requests
from urllib.parse import urljoin

from groq import Groq
from bs4 import BeautifulSoup
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings

from .models import Theme, Source, CuratedSource
from digests.models import AIUsageLog

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_themes(request):
    themes = Theme.objects.filter(user=request.user)
    return Response([
        {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "keywords": t.keywords,
            "is_active": t.is_active,
            "frequency": t.frequency,
            "created_at": t.created_at.isoformat(),
            "sources": [
                {"id": s.id, "name": s.name, "url": s.url, "type": s.source_type}
                for s in t.sources.all()
            ],
        }
        for t in themes.prefetch_related('sources')
    ])


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def suggest_themes(request):
    """Recoit un texte libre et retourne 2 suggestions de themes via Groq."""
    user_input = request.data.get('text', '').strip()
    if not user_input:
        return Response(
            {"error": "Veuillez entrer un sujet ou une description."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    api_key = settings.GROQ_API_KEY
    if not api_key:
        return Response(
            {"error": "Cle API Groq non configuree."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    try:
        client = Groq(api_key=api_key)

        prompt = f"""Tu es un assistant qui aide a creer des themes de veille informationnelle.
L'utilisateur a saisi ce texte : "{user_input}"

A partir de ce texte, propose exactement 2 themes de veille pertinents.
Pour chaque theme, donne :
- name: un nom court et clair (max 5 mots, en francais)
- description: une description en 1 phrase de ce que le theme couvre
- keywords: une liste de 10 a 15 mots-cles pertinents pour la recherche d'articles. IMPORTANT : inclure chaque mot-cle EN FRANCAIS ET EN ANGLAIS. Exemple : si le mot-cle est "intelligence artificielle", ajouter aussi "artificial intelligence". Cela permet de matcher les articles dans les deux langues.

Reponds UNIQUEMENT en JSON valide, sans markdown, sans backticks, avec cette structure exacte :
[
  {{"name": "...", "description": "...", "keywords": ["...", "..."]}},
  {{"name": "...", "description": "...", "keywords": ["...", "..."]}}
]"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500,
        )

        # Tracker les tokens
        usage = response.usage
        AIUsageLog.objects.create(
            feature="suggest_themes",
            model="llama-3.3-70b-versatile",
            prompt_tokens=usage.prompt_tokens,
            completion_tokens=usage.completion_tokens,
            total_tokens=usage.total_tokens,
            user=request.user,
        )

        text = _clean_json(response.choices[0].message.content.strip())
        suggestions = json.loads(text)

        if not isinstance(suggestions, list) or len(suggestions) < 2:
            raise ValueError("Reponse IA invalide")

        return Response({"suggestions": suggestions[:2]})

    except json.JSONDecodeError:
        return Response(
            {"error": "L'IA a retourne une reponse invalide. Reessayez."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    except Exception as e:
        return Response(
            {"error": f"Erreur lors de la suggestion: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def _clean_json(text):
    """Nettoie la reponse IA pour extraire du JSON valide."""
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def _check_rss(url: str) -> str | None:
    """Verifie si un site a un flux RSS. Retourne l'URL du feed ou None."""
    HEADERS = {"User-Agent": "DailyDigest Bot/1.0"}
    base = url.rstrip("/")

    # 1. Tester les chemins classiques
    for path in ["/feed", "/rss", "/feed.xml", "/rss.xml", "/atom.xml"]:
        try:
            resp = http_requests.head(
                base + path, headers=HEADERS, timeout=5, allow_redirects=True
            )
            if resp.status_code == 200:
                ct = resp.headers.get("content-type", "")
                if any(t in ct for t in ["xml", "rss", "atom"]):
                    return base + path
        except Exception:
            continue

    # 2. Chercher <link type="application/rss+xml"> dans le HTML
    try:
        resp = http_requests.get(url, headers=HEADERS, timeout=8)
        soup = BeautifulSoup(resp.text, "html.parser")
        for link in soup.find_all("link", type=lambda t: t and ("rss" in t or "atom" in t)):
            href = link.get("href", "")
            if href:
                return urljoin(url, href) if href.startswith("/") else href
    except Exception:
        pass

    return None


def _validate_url(url: str) -> bool:
    """Verifie qu'une URL est accessible."""
    try:
        resp = http_requests.head(
            url, headers={"User-Agent": "DailyDigest Bot/1.0"},
            timeout=8, allow_redirects=True
        )
        return resp.status_code < 400
    except Exception:
        return False


def _validate_sources(sources: list[dict]) -> list[dict]:
    """Valide les sources IA : verifie l'URL et detecte le type rss/html."""
    validated = []
    for src in sources:
        url = src.get("url", "").strip()
        if not url or not url.startswith("http"):
            continue

        # Verifier que le site est accessible
        if not _validate_url(url):
            logger.info(f"Source inaccessible, skip: {url}")
            continue

        # Detecter RSS
        rss_url = _check_rss(url)
        if rss_url:
            src["type"] = "rss"
            src["url"] = rss_url if rss_url != url else url
        else:
            src["type"] = "html"

        validated.append(src)

    return validated


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def suggest_sources(request):
    """Suggere des sources : d'abord la base curatee, puis complete avec l'IA si besoin."""
    theme_name = request.data.get('name', '').strip()
    keywords = request.data.get('keywords', [])

    if not theme_name:
        return Response(
            {"error": "Le nom du theme est requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 1. Chercher dans la base curatee
    search_terms = [k.lower() for k in keywords] + theme_name.lower().split()
    curated = CuratedSource.objects.filter(is_active=True)
    curated_results = []

    for source in curated:
        tags_lower = [t.lower() for t in source.tags]
        desc_lower = source.description.lower()
        name_lower = source.name.lower()

        score = 0
        for term in search_terms:
            if any(term in tag for tag in tags_lower):
                score += 2
            if term in desc_lower:
                score += 1
            if term in name_lower:
                score += 1

        if score > 0:
            curated_results.append((score, source))

    curated_results.sort(key=lambda x: (-x[0], -x[1].priority))
    curated_sources = [
        {"name": s.name, "url": s.url, "type": s.source_type, "curated": True}
        for _, s in curated_results[:10]
    ]

    # 2. Si on a 10 sources curatees, pas besoin d'IA
    remaining = 10 - len(curated_sources)
    if remaining <= 0:
        return Response({
            "sources": curated_sources[:10],
            "curated_count": len(curated_sources),
        })

    # 3. Completer avec l'IA
    api_key = settings.GROQ_API_KEY
    ai_sources = []

    if api_key and remaining > 0:
        try:
            client = Groq(api_key=api_key)
            kw_str = ", ".join(keywords) if keywords else theme_name

            # Exclure les URLs deja dans curated
            exclude = ", ".join(s["url"] for s in curated_sources)
            exclude_text = f"\nExclure ces sites deja selectionnes: {exclude}" if exclude else ""

            prompt = f"""Expert veille. Theme: "{theme_name}". Mots-cles: {kw_str}.
Trouve {remaining + 5} sites web d'actualite REELS et ACTIFS pour ce theme.{exclude_text}
Privilegier les grands sites reconnus avec du contenu regulier.
JSON uniquement: [{{"name":"...","url":"https://..."}}]
Pas de champ type, on le detecte automatiquement."""

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=500,
            )

            # Tracker les tokens
            usage = response.usage
            AIUsageLog.objects.create(
                feature="suggest_sources",
                model="llama-3.3-70b-versatile",
                prompt_tokens=usage.prompt_tokens,
                completion_tokens=usage.completion_tokens,
                total_tokens=usage.total_tokens,
                user=request.user,
            )

            text = _clean_json(response.choices[0].message.content.strip())
            raw = json.loads(text)

            if isinstance(raw, list):
                existing_urls = {s["url"] for s in curated_sources}
                # Filtrer les doublons
                candidates = [s for s in raw if s.get("url") not in existing_urls]
                # Valider les URLs et detecter RSS/HTML
                validated = _validate_sources(candidates)
                for s in validated[:remaining]:
                    s["curated"] = False
                    ai_sources.append(s)

        except Exception:
            pass  # On a au moins les curated

    all_sources = curated_sources + ai_sources
    return Response({
        "sources": all_sources[:10],
        "curated_count": len(curated_sources),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_theme(request):
    """Cree un theme avec ses sources et genere un digest immediat."""
    from django.utils import timezone
    from datetime import timedelta

    name = request.data.get('name', '').strip()
    description = request.data.get('description', '')
    keywords = request.data.get('keywords', [])
    sources_data = request.data.get('sources', [])
    filter_criteria = request.data.get('filter_criteria', [])

    if not name:
        return Response(
            {"error": "Le nom du theme est requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Vérifier limite 1x par semaine
    user = request.user
    if user.last_theme_change:
        time_since_change = timezone.now() - user.last_theme_change
        if time_since_change < timedelta(days=7):
            days_left = 7 - time_since_change.days
            return Response(
                {"error": f"Vous pouvez changer votre theme une fois par semaine. Reessayez dans {days_left} jour(s)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if Theme.objects.filter(user=request.user).exists():
        return Response(
            {"error": "Vous avez deja un theme. Supprimez-le avant d'en creer un nouveau."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Marquer le changement de theme
    user.last_theme_change = timezone.now()
    user.save(update_fields=['last_theme_change'])

    theme = Theme.objects.create(
        user=request.user,
        name=name,
        description=description,
        keywords=keywords if isinstance(keywords, list) else [],
        filter_criteria=filter_criteria if isinstance(filter_criteria, list) else [],
        is_active=True,
    )

    # Creer ou recuperer les sources et les lier au theme
    for src in sources_data[:10]:
        source, _ = Source.objects.get_or_create(
            url=src.get('url', ''),
            defaults={
                'name': src.get('name', ''),
                'source_type': src.get('type', 'rss'),
            }
        )
        theme.sources.add(source)

    # Lancer le scraping immediat des sources en arriere-plan
    try:
        from digests.tasks import scrape_theme_sources, generate_and_send_first_digest
        scrape_theme_sources.delay(theme.id)
        # Generer et envoyer le premier digest immediatement
        generate_and_send_first_digest.delay(theme.id)
    except Exception:
        pass  # Si Redis n'est pas dispo, on skip silencieusement

    return Response({
        "id": theme.id,
        "name": theme.name,
        "description": theme.description,
        "keywords": theme.keywords,
        "is_active": theme.is_active,
        "sources_count": theme.sources.count(),
        "message": f"Theme '{theme.name}' cree avec {theme.sources.count()} sources !",
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def match_curated_sources(request):
    """Cherche dans la base curatee les sources qui matchent les mots-cles du theme."""
    keywords = request.data.get('keywords', [])
    theme_name = request.data.get('name', '').strip().lower()

    if not keywords and not theme_name:
        return Response({"sources": []})

    # Construire les termes de recherche
    search_terms = [k.lower() for k in keywords]
    if theme_name:
        search_terms.extend(theme_name.split())

    curated = CuratedSource.objects.filter(is_active=True)
    matched = []

    for source in curated:
        tags_lower = [t.lower() for t in source.tags]
        desc_lower = source.description.lower()
        name_lower = source.name.lower()

        # Score de matching : combien de termes matchent
        score = 0
        for term in search_terms:
            if any(term in tag for tag in tags_lower):
                score += 2  # Match tag = poids fort
            if term in desc_lower:
                score += 1
            if term in name_lower:
                score += 1

        if score > 0:
            matched.append((score, source))

    # Trier par score decroissant, limiter a 10
    matched.sort(key=lambda x: (-x[0], -x[1].priority))
    results = [
        {
            "name": s.name,
            "url": s.url,
            "type": s.source_type,
            "description": s.description,
            "curated": True,
        }
        for _, s in matched[:10]
    ]

    return Response({"sources": results, "count": len(results)})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_theme(request, theme_id):
    """Supprime un theme de l'utilisateur et marque le changement pour la limite 1x/semaine."""
    from django.utils import timezone

    try:
        theme = Theme.objects.get(id=theme_id, user=request.user)
    except Theme.DoesNotExist:
        return Response(
            {"error": "Theme introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )
    theme.delete()

    # Marquer la suppression comme un changement de theme (limite 1x/semaine)
    user = request.user
    user.last_theme_change = timezone.now()
    user.save(update_fields=['last_theme_change'])

    return Response({"message": "Theme supprime."}, status=status.HTTP_200_OK)
