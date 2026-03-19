from django.db import models
from cloudinary.models import CloudinaryField


class SocialPost(models.Model):
    PLATFORM_CHOICES = [
        ("facebook", "Facebook"),
        ("linkedin", "LinkedIn"),
        ("twitter", "Twitter/X"),
    ]

    POST_TYPE_CHOICES = [
        ("informatif", "Informatif"),
        ("preuve_sociale", "Preuve sociale"),
        ("promotionnel", "Promotionnel"),
    ]

    STATUS_CHOICES = [
        ("brouillon", "Brouillon"),
        ("valide", "Valide"),
        ("publie", "Publie"),
        ("rejete", "Rejete"),
    ]

    # Planning
    day = models.IntegerField(help_text="Jour dans la campagne (1-90)")
    date_label = models.CharField(max_length=100)
    scheduled_date = models.DateField(null=True, blank=True)

    # Contenu
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    post_type = models.CharField(max_length=20, choices=POST_TYPE_CHOICES)
    text = models.TextField()
    hashtags = models.JSONField(default=list)
    image_description = models.TextField(blank=True)
    cta = models.CharField(max_length=500, blank=True)
    objective = models.CharField(max_length=500, blank=True)

    # Workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="brouillon")
    image = CloudinaryField("image", folder="social_posts", blank=True, null=True)

    # Tracking
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Mois de campagne (1, 2, 3)
    month = models.IntegerField(default=1)

    class Meta:
        ordering = ["day", "platform"]

    def __str__(self):
        return f"Jour {self.day} - {self.platform} - {self.post_type}"
