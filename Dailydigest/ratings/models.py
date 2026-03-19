from django.db import models
from django.conf import settings


class ArticleRating(models.Model):
    RATING_CHOICES = [
        (1, "Pas utile"),
        (2, "Peu utile"),
        (3, "Neutre"),
        (4, "Utile"),
        (5, "Très utile"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="article_ratings")
    article = models.ForeignKey("digests.Article", on_delete=models.CASCADE, related_name="ratings")

    rating = models.IntegerField(choices=RATING_CHOICES)
    feedback = models.TextField(blank=True, help_text="Commentaire optionnel de l'utilisateur")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Article Rating"
        verbose_name_plural = "Article Ratings"
        unique_together = [("user", "article")]
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["article", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.article.title[:50]}... ({self.rating}/5)"


class UserFeedback(models.Model):
    FEEDBACK_TYPE = [
        ("bug", "Bug Report"),
        ("suggestion", "Suggestion"),
        ("feedback", "General Feedback"),
    ]

    STATUS_CHOICES = [
        ("open", "Open"),
        ("under_review", "Under Review"),
        ("in_progress", "In Progress"),
        ("resolved", "Resolved"),
        ("wontfix", "Won't Fix"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="feedback")

    type = models.CharField(max_length=20, choices=FEEDBACK_TYPE)
    subject = models.CharField(max_length=255)
    message = models.TextField()

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    priority = models.CharField(
        max_length=10,
        choices=[("low", "Low"), ("medium", "Medium"), ("high", "High")],
        default="medium"
    )

    admin_response = models.TextField(blank=True, null=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Feedback"
        verbose_name_plural = "User Feedbacks"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"[{self.type.upper()}] {self.subject} ({self.status})"
