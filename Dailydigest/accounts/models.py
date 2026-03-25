from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    preferred_time = models.TimeField(default="07:00", help_text="Heure d'envoi du digest (UTC)")
    language = models.CharField(
        max_length=5,
        default="fr",
        choices=[("fr", "Français"), ("en", "English")],
    )
    marketing_consent = models.BooleanField(default=False, help_text="Accepte les emails marketing")
    last_theme_change = models.DateTimeField(null=True, blank=True, help_text="Derniere modification de theme (limite 1x/semaine)")
    phone_number = models.CharField(max_length=20, null=True, blank=True, help_text="Numero WhatsApp au format +33...")
    whatsapp_enabled = models.BooleanField(default=False, help_text="Activer les digests par WhatsApp")

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.email}"

    def get_active_themes(self):
        return self.themes.filter(is_active=True)

    def get_active_subscription(self):
        return self.subscriptions.filter(
            status__in=["active", "past_due"]
        ).first()

    def is_paid_user(self):
        return self.get_active_subscription() is not None
