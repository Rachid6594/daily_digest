"""
Taches Celery pour le pipeline de digests.
- run_daily_pipeline : pipeline complet quotidien (6h du matin)
- scrape_theme_sources : scrape immediat des sources d'un theme (a la creation)
"""
import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name="digests.tasks.run_daily_pipeline")
def run_daily_pipeline():
    """Pipeline quotidien : scrape toutes les sources → filtre → IA → digest."""
    from digests.pipeline import run_pipeline
    logger.info("Lancement du pipeline quotidien via Celery")
    run_pipeline()
    logger.info("Pipeline quotidien termine")


@shared_task(name="digests.tasks.scrape_theme_sources")
def scrape_theme_sources(theme_id):
    """
    Scrape immediat des sources d'un theme.
    Appele a la creation d'un theme pour que l'utilisateur ait du contenu tout de suite.
    Ensuite genere un premier digest.
    """
    from themes.models import Theme
    from digests.scraper import scrape_source
    from digests.pipeline import generate_digest_for_theme

    try:
        theme = Theme.objects.get(id=theme_id)
    except Theme.DoesNotExist:
        logger.error(f"Theme {theme_id} introuvable")
        return

    logger.info(f"Scrape immediat pour le theme '{theme.name}' (user: {theme.user.email})")

    # Scraper chaque source du theme
    sources = theme.sources.filter(is_active=True)
    total_added = 0

    for source in sources:
        result = scrape_source(source)
        total_added += result.get("added", 0)
        logger.info(f"  Source '{source.name}': {result['added']} nouveaux articles")

    logger.info(f"Scrape termine: {total_added} nouveaux articles au total")

    # Generer le premier digest
    if total_added > 0:
        digest = generate_digest_for_theme(theme)
        if digest:
            logger.info(f"Premier digest genere pour '{theme.name}' (status: {digest.status})")
    else:
        logger.info(f"Aucun article trouve, pas de digest genere pour '{theme.name}'")
