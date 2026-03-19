from django.db import models
from django.conf import settings
from django.utils import timezone


class Subscription(models.Model):
    SUBSCRIPTION_STATUS = [
        ("active", "Active"),
        ("past_due", "Past Due"),
        ("canceled", "Canceled"),
        ("incomplete", "Incomplete"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscriptions")

    stripe_subscription_id = models.CharField(max_length=255, unique=True, help_text="ID de l'abonnement Stripe")
    stripe_customer_id = models.CharField(max_length=255, help_text="ID du client Stripe")

    status = models.CharField(max_length=20, choices=SUBSCRIPTION_STATUS, default="incomplete")
    plan_type = models.CharField(
        max_length=50,
        default="pro",
        choices=[("pro", "Pro ($10/thème/mois)")],
    )

    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    canceled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Subscription"
        verbose_name_plural = "Subscriptions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.status}"

    def is_active(self):
        return self.status in ["active", "past_due"] and self.current_period_end > timezone.now()
