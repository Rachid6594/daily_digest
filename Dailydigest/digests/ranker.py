"""
Tri et resume des articles par IA (Groq).
Recoit les articles pre-filtres et retourne les 10 meilleurs avec resumes.
"""
import json
import logging

from groq import Groq
from django.conf import settings

from digests.models import Article, AIUsageLog

logger = logging.getLogger(__name__)


def rank_and_summarize(
    theme_name: str,
    keywords: list[str],
    articles: list[Article],
    filter_criteria: list[str] | None = None,
    max_results: int = 10,
) -> list[dict]:
    """
    Envoie les articles pre-filtres a Groq pour :
    1. Classer par pertinence
    2. Generer un resume de 2-3 phrases par article
    Retourne les top N articles avec score et resume.
    """
    if not articles:
        return []

    api_key = settings.GROQ_API_KEY
    if not api_key:
        logger.error("GROQ_API_KEY non configuree")
        return []

    # Preparer les articles en format compact (economie de tokens)
    articles_text = ""
    for i, art in enumerate(articles[:30]):
        preview = f" | {art.content_preview[:150]}" if art.content_preview else ""
        articles_text += f"[{i+1}] {art.title}{preview}\n"

    # Construire les criteres utilisateur
    criteria_text = ""
    if filter_criteria:
        criteria_text = "\nCriteres utilisateur:\n" + "\n".join(f"- {c}" for c in filter_criteria) + "\n"

    prompt = f"""Editeur newsletter. Theme: "{theme_name}". Mots-cles: {", ".join(keywords) if keywords else theme_name}.
{criteria_text}
Articles:
{articles_text}
Selectionne les {max_results} plus pertinents. Score 0-10, resume 2 phrases FR.
JSON uniquement: [{{"index":1,"score":9.5,"summary":"..."}}]
index = numero [X]. Seulement score >= 5."""

    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2000,
        )

        # Tracker les tokens
        usage = response.usage
        AIUsageLog.objects.create(
            feature="rank_articles",
            model="llama-3.3-70b-versatile",
            prompt_tokens=usage.prompt_tokens,
            completion_tokens=usage.completion_tokens,
            total_tokens=usage.total_tokens,
        )

        text = _clean_json(response.choices[0].message.content.strip())
        ranked = json.loads(text)

        if not isinstance(ranked, list):
            raise ValueError("Reponse IA invalide")

        # Mapper les resultats aux objets Article
        results = []
        articles_list = list(articles[:30])
        for item in ranked:
            idx = item.get("index", 0) - 1  # L'IA utilise 1-based
            if 0 <= idx < len(articles_list):
                results.append({
                    "article": articles_list[idx],
                    "score": float(item.get("score", 0)),
                    "summary": item.get("summary", ""),
                })

        # Trier par score decroissant
        results.sort(key=lambda x: x["score"], reverse=True)

        logger.info(f"Ranker: {len(results)} articles selectionnes pour '{theme_name}'")
        return results[:max_results]

    except json.JSONDecodeError:
        logger.error("Reponse IA invalide (JSON decode error)")
        return []
    except Exception as e:
        logger.error(f"Erreur ranker: {e}")
        return []


def _clean_json(text: str) -> str:
    """Nettoie la reponse IA pour extraire du JSON valide."""
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()
