"""
Taches Celery pour le pipeline de digests.
- run_daily_pipeline : pipeline complet quotidien (6h du matin)
- scrape_theme_sources : scrape immediat des sources d'un theme (a la creation)
"""
import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name="digests.tasks.run_daily_pipeline")
def run_daily_pipeline(run_id=None, force=False):
    """Pipeline quotidien : scrape toutes les sources → filtre → IA → digest."""
    from digests.pipeline import run_pipeline, run_pipeline_with_run
    logger.info(f"Lancement du pipeline via Celery (force={force})")
    if run_id:
        run_pipeline_with_run(run_id, force=force)
    else:
        run_pipeline()
    logger.info("Pipeline termine")


@shared_task(name="digests.tasks.send_digests_at_user_time")
def send_digests_at_user_time():
    """
    Envoie les digests 'ready' si c'est l'heure preferee de chaque utilisateur.
    S'execute toutes les heures via Celery Beat.
    """
    from digests.emailer import send_digests_respecting_user_time
    logger.info("Lancement envoi digests avec verification heure utilisateur")
    result = send_digests_respecting_user_time()
    logger.info(f"Resultat: {result}")
    return result


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


@shared_task(name="digests.tasks.generate_and_send_first_digest")
def generate_and_send_first_digest(theme_id):
    """
    Genere et envoie immediatement le premier digest apres creation du theme.
    Attends quelques secondes que les articles soient scrapes, puis envoie.
    """
    import time
    from themes.models import Theme
    from digests.models import Digest
    from digests.emailer import send_digest_email

    try:
        theme = Theme.objects.get(id=theme_id)
    except Theme.DoesNotExist:
        logger.error(f"Theme {theme_id} introuvable")
        return

    # Attendre jusqu'a 30s que le digest soit genere
    for attempt in range(30):
        digest = Digest.objects.filter(theme=theme, user=theme.user).order_by('-created_at').first()
        if digest and digest.status == 'ready':
            logger.info(f"Digest pret, envoi immediatement a {theme.user.email}")
            send_digest_email(digest)
            return
        time.sleep(1)

    logger.warning(f"Timeout: digest non pret apres 30s pour theme {theme_id}")
