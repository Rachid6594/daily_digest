"""
Scraper de sources : RSS et HTML.
Scrape chaque Source une seule fois, stocke les Articles en base.
"""
import logging
import re
from datetime import datetime, timedelta

import feedparser
import requests
from bs4 import BeautifulSoup
from django.utils import timezone

from themes.models import Source
from digests.models import Article, ScrapeJob

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "DailyDigest Bot/1.0 (news aggregator)"
}
TIMEOUT = 15


def scrape_all_active_sources():
    """Scrape toutes les sources actives (utilisees par au moins un theme)."""
    sources = Source.objects.filter(
        is_active=True,
        themes__is_active=True,
    ).distinct()

    results = []
    for source in sources:
        # Eviter de re-scraper si deja fait dans les 12 dernieres heures
        if source.last_scraped and source.last_scraped > timezone.now() - timedelta(hours=12):
            logger.info(f"Skip {source.name} (scrape recent)")
            continue

        result = scrape_source(source)
        results.append(result)

    return results


def scrape_source(source: Source) -> dict:
    """Scrape une source individuelle et stocke les articles."""
    job = ScrapeJob.objects.create(source=source, status="running")
    found = 0
    added = 0

    try:
        if source.source_type == "rss":
            articles_data = _scrape_rss(source.url)
            # Fallback HTML si RSS echoue ou retourne rien
            if not articles_data:
                logger.info(f"RSS vide pour {source.name}, fallback HTML")
                articles_data = _scrape_html(source.url)
                # Mettre a jour le type pour les prochains scrapes
                if articles_data:
                    source.source_type = "html"
                    source.save(update_fields=["source_type"])
        else:
            articles_data = _scrape_html(source.url)

        found = len(articles_data)

        for art in articles_data:
            if not art.get("url") or not art.get("title"):
                continue
            # Deduplication par URL
            _, created = Article.objects.get_or_create(
                url=art["url"],
                defaults={
                    "source": source,
                    "title": art["title"][:500],
                    "content_preview": art.get("preview", "")[:500],
                    "published_at": art.get("published_at"),
                }
            )
            if created:
                added += 1

        source.last_scraped = timezone.now()
        source.success_count += 1
        source.save(update_fields=["last_scraped", "success_count"])

        job.status = "success"
        job.articles_found = found
        job.articles_added = added
        job.completed_at = timezone.now()
        job.save()

        logger.info(f"Scrape {source.name}: {found} trouves, {added} nouveaux")

    except Exception as e:
        source.error_count += 1
        source.save(update_fields=["error_count"])

        job.status = "failed"
        job.error_message = str(e)[:500]
        job.completed_at = timezone.now()
        job.save()

        logger.error(f"Erreur scrape {source.name}: {e}")

    return {"source": source.name, "found": found, "added": added, "status": job.status}


def _scrape_rss(url: str) -> list[dict]:
    """Parse un flux RSS et retourne les articles."""
    # Essayer de trouver le flux RSS si l'URL est un site
    feed_url = _find_rss_feed(url)
    feed = feedparser.parse(feed_url)

    articles = []
    for entry in feed.entries[:30]:  # max 30 par source
        pub_date = None
        if hasattr(entry, "published_parsed") and entry.published_parsed:
            try:
                pub_date = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
            except Exception:
                pass

        preview = ""
        if hasattr(entry, "summary"):
            preview = _clean_html(entry.summary)
        elif hasattr(entry, "description"):
            preview = _clean_html(entry.description)

        articles.append({
            "title": entry.get("title", "").strip(),
            "url": entry.get("link", "").strip(),
            "preview": preview[:500],
            "published_at": pub_date,
        })

    return articles


def _scrape_html(url: str) -> list[dict]:
    """Scrape une page HTML pour extraire les articles."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
    except Exception as e:
        logger.warning(f"Erreur HTTP {url}: {e}")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    articles = []

    # Chercher les liens d'articles dans les balises communes
    for tag in soup.find_all("a", href=True):
        href = tag["href"]
        title = tag.get_text(strip=True)

        # Filtrer les liens non-articles
        if not title or len(title) < 20 or len(title) > 300:
            continue
        if href.startswith("#") or href.startswith("javascript"):
            continue

        # Construire URL absolue
        if href.startswith("/"):
            from urllib.parse import urljoin
            href = urljoin(url, href)
        elif not href.startswith("http"):
            continue

        # Eviter nav, footer, etc.
        parent = tag.parent
        skip = False
        for _ in range(3):
            if parent and parent.name in ("nav", "footer", "header", "aside"):
                skip = True
                break
            parent = parent.parent if parent else None
        if skip:
            continue

        articles.append({
            "title": title[:500],
            "url": href,
            "preview": "",
            "published_at": None,
        })

    # Deduplication locale par URL
    seen = set()
    unique = []
    for a in articles:
        if a["url"] not in seen:
            seen.add(a["url"])
            unique.append(a)

    return unique[:30]


def _find_rss_feed(url: str) -> str:
    """Essaie de trouver le flux RSS d'un site. Retourne l'URL du feed."""
    # Si c'est deja un feed
    if any(ext in url.lower() for ext in ["/feed", "/rss", ".xml", "atom"]):
        return url

    # Tenter les chemins classiques
    common_paths = ["/feed", "/rss", "/feed.xml", "/rss.xml", "/atom.xml"]
    base_url = url.rstrip("/")

    for path in common_paths:
        feed_url = base_url + path
        try:
            resp = requests.head(feed_url, headers=HEADERS, timeout=5, allow_redirects=True)
            if resp.status_code == 200:
                content_type = resp.headers.get("content-type", "")
                if any(t in content_type for t in ["xml", "rss", "atom", "text"]):
                    return feed_url
        except Exception:
            continue

    # Chercher dans le HTML
    try:
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        soup = BeautifulSoup(resp.text, "html.parser")
        link = soup.find("link", type=re.compile(r"rss|atom|xml"))
        if link and link.get("href"):
            href = link["href"]
            if href.startswith("/"):
                from urllib.parse import urljoin
                href = urljoin(url, href)
            return href
    except Exception:
        pass

    # Fallback : retourner l'URL originale, feedparser gerera l'echec
    return url


def _clean_html(text: str) -> str:
    """Supprime les balises HTML d'un texte."""
    if not text:
        return ""
    soup = BeautifulSoup(text, "html.parser")
    return soup.get_text(separator=" ", strip=True)
