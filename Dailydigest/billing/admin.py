from django.contrib import admin
from .models import Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "status", "plan_type", "current_period_start", "current_period_end")
    list_filter = ("status", "plan_type")
    search_fields = ("user__email", "stripe_subscription_id")
