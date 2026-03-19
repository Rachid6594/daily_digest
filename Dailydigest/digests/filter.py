"""
Pre-filtre mecanique des articles par mots-cles.
Filtre gratuit (pas d'appel IA) pour reduire le volume avant le tri IA.
"""
import re
import logging
from datetime import timedelta

from django.utils import timezone

from themes.models import Theme
from digests.models import Article

logger = logging.getLogger(__name__)


def get_filtered_articles(theme: Theme, days: int = 2) -> list[Article]:
    """
    Retourne les articles des sources du theme
    qui matchent au moins 1 mot-cle dans le titre ou le preview.
    Limite aux articles des N derniers jours.
    """
    source_ids = theme.sources.values_list("id", flat=True)
    cutoff = timezone.now() - timedelta(days=days)

    # Tous les articles recents des sources du theme
    articles = Article.objects.filter(
        source_id__in=source_ids,
        scraped_at__gte=cutoff,
    )

    keywords = _expand_keywords(theme.get_keywords_list())

    if not keywords:
        # Pas de mots-cles = on prend tout (l'IA triera)
        return list(articles[:50])

    # Filtre mecanique
    matched = []
    for article in articles:
        text = f"{article.title} {article.content_preview}".lower()
        if _matches_keywords(text, keywords):
            matched.append(article)

    logger.info(
        f"Theme '{theme.name}': {articles.count()} articles -> {len(matched)} apres filtre mots-cles"
    )

    return matched[:50]  # Cap a 50 pour l'IA


def _expand_keywords(keywords: list[str]) -> list[str]:
    """
    Enrichit les mots-cles avec des variantes basiques.
    Ex: 'startup' -> ['startup', 'startups', 'start-up', 'start-ups']
    """
    expanded = set()
    for kw in keywords:
        kw_lower = kw.lower().strip()
        if not kw_lower:
            continue

        expanded.add(kw_lower)

        # Pluriel simple
        if not kw_lower.endswith("s"):
            expanded.add(kw_lower + "s")

        # Avec/sans tiret
        if "-" in kw_lower:
            expanded.add(kw_lower.replace("-", " "))
            expanded.add(kw_lower.replace("-", ""))
        elif " " in kw_lower:
            expanded.add(kw_lower.replace(" ", "-"))

    return list(expanded)


def _matches_keywords(text: str, keywords: list[str]) -> bool:
    """Verifie si le texte contient au moins un mot-cle."""
    for kw in keywords:
        if kw in text:
            return True
    return False
