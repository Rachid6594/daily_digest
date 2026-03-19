from django.contrib import admin
from .models import Source, Theme


@admin.register(Source)
class SourceAdmin(admin.ModelAdmin):
    list_display = ("name", "source_type", "is_active", "last_scraped", "success_count", "error_count")
    list_filter = ("source_type", "is_active")
    search_fields = ("name", "url")


@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "is_active", "frequency", "articles_last_digest", "last_digest_sent")
    list_filter = ("is_active", "frequency")
    search_fields = ("name", "user__email")
    filter_horizontal = ("sources",)
