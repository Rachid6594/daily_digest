from django.contrib import admin
from .models import ArticleRating, UserFeedback


@admin.register(ArticleRating)
class ArticleRatingAdmin(admin.ModelAdmin):
    list_display = ("user", "article", "rating", "created_at")
    list_filter = ("rating",)
    search_fields = ("user__email",)


@admin.register(UserFeedback)
class UserFeedbackAdmin(admin.ModelAdmin):
    list_display = ("user", "type", "subject", "status", "priority", "created_at")
    list_filter = ("type", "status", "priority")
    search_fields = ("user__email", "subject")
