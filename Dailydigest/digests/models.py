from django.db import models
from django.conf import settings


class Article(models.Model):
    """Article scrape depuis une source. Stocke une seule fois par URL."""
    source = models.ForeignKey("themes.Source", on_delete=models.CASCADE, related_name="articles")

    title = models.CharField(max_length=500)
    url = models.URLField(max_length=2000, unique=True)
    content_preview = models.TextField(blank=True, help_text="Premiers 500 caracteres du contenu")

    published_at = models.DateTimeField(null=True, blank=True)
    scraped_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Article"
        verbose_name_plural = "Articles"
        ordering = ["-scraped_at"]
        indexes = [
            models.Index(fields=["source", "-scraped_at"]),
            models.Index(fields=["-published_at"]),
        ]

    def __str__(self):
        return f"{self.title[:80]}"


class DigestArticle(models.Model):
    """Article selectionne pour un digest utilisateur."""
    digest = models.ForeignKey("Digest", on_delete=models.CASCADE, related_name="items")
    article = models.ForeignKey(Article, on_delete=models.CASCADE)

    summary = models.TextField(blank=True, help_text="Resume genere par IA")
    relevance_score = models.FloatField(default=0.0, help_text="Score de pertinence (0-10)")
    position = models.IntegerField(default=0, help_text="Position dans le digest")

    class Meta:
        ordering = ["position"]
        unique_together = [("digest", "article")]


class Digest(models.Model):
    """Un digest genere pour un theme/user."""
    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("generating", "En generation"),
        ("ready", "Pret"),
        ("sent", "Envoye"),
        ("failed", "Echoue"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="digests")
    theme = models.ForeignKey("themes.Theme", on_delete=models.CASCADE, related_name="digests")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    articles = models.ManyToManyField(Article, through=DigestArticle, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["theme", "-created_at"]),
        ]

    def __str__(self):
        return f"Digest {self.user.email} - {self.theme.name} ({self.status})"


class ScrapeJob(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("running", "Running"),
        ("success", "Success"),
        ("failed", "Failed"),
    ]

    source = models.ForeignKey("themes.Source", on_delete=models.CASCADE, related_name="scrape_jobs")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    articles_found = models.IntegerField(default=0)
    articles_added = models.IntegerField(default=0)

    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ["-started_at"]
        indexes = [
            models.Index(fields=["source", "-started_at"]),
        ]

    def __str__(self):
        return f"{self.source.name} - {self.status}"


class EmailLog(models.Model):
    SEND_STATUS = [
        ("sent", "Sent"),
        ("delivered", "Delivered"),
        ("bounced", "Bounced"),
        ("failed", "Failed"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="email_logs")
    digest = models.ForeignKey(Digest, on_delete=models.CASCADE, related_name="email_logs")

    subject = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=SEND_STATUS, default="sent")
    sent_at = models.DateTimeField(auto_now_add=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ["-sent_at"]

    def __str__(self):
        return f"{self.user.email} - {self.status}"


class PipelineRun(models.Model):
    """Suivi en temps reel d'une execution du pipeline."""
    STATUS_CHOICES = [
        ("running", "En cours"),
        ("completed", "Termine"),
        ("failed", "Echoue"),
    ]

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="running")
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Etapes
    current_step = models.CharField(max_length=50, default="init")
    current_step_label = models.CharField(max_length=200, default="Initialisation...")

    # Compteurs
    total_sources = models.IntegerField(default=0)
    scraped_sources = models.IntegerField(default=0)
    total_articles_found = models.IntegerField(default=0)
    total_articles_new = models.IntegerField(default=0)

    total_themes = models.IntegerField(default=0)
    processed_themes = models.IntegerField(default=0)
    total_digests_created = models.IntegerField(default=0)

    # Log des etapes (JSON list)
    steps_log = models.JSONField(default=list)

    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"Pipeline {self.id} - {self.status} ({self.started_at:%d/%m %H:%M})"

    def log_step(self, step: str, label: str, detail: str = ""):
        """Ajoute une etape au log et met a jour l'etat courant."""
        from django.utils import timezone
        self.current_step = step
        self.current_step_label = label
        self.steps_log.append({
            "step": step,
            "label": label,
            "detail": detail,
            "time": timezone.now().isoformat(),
        })
        self.save(update_fields=["current_step", "current_step_label", "steps_log"])


class AIUsageLog(models.Model):
    """Tracking de chaque appel IA (Groq) avec tokens consommes."""
    FEATURE_CHOICES = [
        ("suggest_themes", "Suggestion de themes"),
        ("suggest_sources", "Suggestion de sources"),
        ("rank_articles", "Ranking d'articles"),
        ("generate_posts", "Generation de posts"),
        ("other", "Autre"),
    ]

    feature = models.CharField(max_length=30, choices=FEATURE_CHOICES)
    model = models.CharField(max_length=100, default="llama-3.3-70b-versatile")

    prompt_tokens = models.IntegerField(default=0)
    completion_tokens = models.IntegerField(default=0)
    total_tokens = models.IntegerField(default=0)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="ai_usage_logs"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["feature", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.feature} - {self.total_tokens} tokens ({self.created_at:%d/%m %H:%M})"


class UserEvent(models.Model):
    """Tracking des etapes d'onboarding et d'interaction utilisateur."""
    EVENT_CHOICES = [
        ("landing_visit", "Visite landing"),
        ("auth_start", "Debut d'inscription"),
        ("auth_complete", "Inscription completee"),
        ("theme_step_1", "Step 1 - Description"),
        ("theme_step_2", "Step 2 - Theme selection"),
        ("theme_step_3", "Step 3 - Confirmation"),
        ("theme_step_4", "Step 4 - Sources"),
        ("theme_step_5", "Step 5 - Criteres"),
        ("theme_step_6", "Step 6 - Recap"),
        ("theme_created", "Theme cree"),
        ("digest_opened", "Email digest ouvert"),
        ("article_clicked", "Article clique"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True,
        related_name="events", help_text="User, null si non authentifie (landing)"
    )
    event_type = models.CharField(max_length=30, choices=EVENT_CHOICES)
    session_id = models.CharField(max_length=100, blank=True, help_text="Session tracking")

    # Contexte additionnel
    extra_data = models.JSONField(default=dict, blank=True, help_text="Donnees supplementaires (step, error, etc.)")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["event_type", "-created_at"]),
            models.Index(fields=["session_id", "-created_at"]),
        ]
        verbose_name = "User Event"
        verbose_name_plural = "User Events"

    def __str__(self):
        user_info = self.user.email if self.user else "anonymous"
        return f"{user_info} - {self.event_type} ({self.created_at:%d/%m %H:%M})"
