from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "username", "language", "preferred_time", "is_active", "date_joined")
    list_filter = ("is_active", "language", "marketing_consent")
    search_fields = ("email", "username")
    ordering = ("-date_joined",)

    fieldsets = BaseUserAdmin.fieldsets + (
        ("DailyDigest", {
            "fields": ("preferred_time", "language", "marketing_consent"),
        }),
    )
