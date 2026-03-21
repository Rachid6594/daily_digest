from django.db import models
from django.conf import settings
import json


class Source(models.Model):
    SOURCE_TYPES = [
        ("rss", "RSS Feed"),
        ("html", "HTML Scraping"),
        ("api", "API"),
    ]

    name = models.CharField(max_length=255, help_text="Nom du site/source")
    url = models.URLField(max_length=2000, unique=True)
    source_type = models.CharField(max_length=10, choices=SOURCE_TYPES, default="rss")

    description = models.TextField(blank=True)
    logo_url = models.URLField(max_length=2000, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    last_scraped = models.DateTimeField(null=True, blank=True)
    success_count = models.IntegerField(default=0, help_text="Nombre de scrapes réussis")
    error_count = models.IntegerField(default=0, help_text="Nombre d'erreurs")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Source"
        verbose_name_plural = "Sources"
        ordering = ["-is_active", "name"]

    def __str__(self):
        return f"{self.name} ({self.source_type})"


class CuratedSource(models.Model):
    """Source curatee par l'admin, organisee par tags pour matching auto."""
    SOURCE_TYPES = [
        ("rss", "RSS Feed"),
        ("html", "HTML Scraping"),
        ("api", "API"),
    ]

    name = models.CharField(max_length=255)
    url = models.URLField(max_length=2000, unique=True)
    source_type = models.CharField(max_length=10, choices=SOURCE_TYPES, default="rss")
    description = models.TextField(blank=True, help_text="Description courte de la source")

    tags = models.JSONField(
        default=list,
        help_text="Tags/categories pour le matching (ex: ['tech', 'startup', 'fintech'])"
    )

    is_active = models.BooleanField(default=True)
    priority = models.IntegerField(default=0, help_text="Plus haut = propose en premier")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Source curatee"
        verbose_name_plural = "Sources curatees"
        ordering = ["-priority", "name"]

    def __str__(self):
        return f"{self.name} ({', '.join(self.tags[:3])})"


class Theme(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="themes")

    name = models.CharField(max_length=255, help_text="Nom du thème (ex: 'Crypto & Web3')")
    description = models.TextField(blank=True, help_text="Description optionnelle pour mémo")

    sources = models.ManyToManyField(Source, related_name="themes", blank=True)

    keywords = models.JSONField(
        default=list,
        help_text="Liste de mots-clés pour filtrer les articles"
    )

    filter_criteria = models.JSONField(
        default=list,
        help_text="Criteres de pertinence definis par l'utilisateur (liste de strings)"
    )

    is_active = models.BooleanField(default=True)
    frequency = models.CharField(
        max_length=20,
        default="daily",
        choices=[("daily", "Quotidien"), ("weekly", "Hebdomadaire")],
    )

    articles_last_digest = models.IntegerField(default=0, help_text="Nombre d'articles du dernier digest")
    last_digest_sent = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Theme"
        verbose_name_plural = "Themes"
        unique_together = [("user", "name")]
        ordering = ["-is_active", "-updated_at"]

    def __str__(self):
        return f"{self.user.email} - {self.name}"

    def get_keywords_list(self):
        if isinstance(self.keywords, list):
            return self.keywords
        return json.loads(self.keywords) if self.keywords else []
