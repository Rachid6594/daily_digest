from django.contrib import admin
from .models import Article, ScrapeJob, EmailLog, Digest, DigestArticle, AIUsageLog


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("title", "source", "published_at", "scraped_at")
    list_filter = ("source",)
    search_fields = ("title", "url")
    ordering = ("-scraped_at",)


@admin.register(ScrapeJob)
class ScrapeJobAdmin(admin.ModelAdmin):
    list_display = ("source", "status", "articles_found", "articles_added", "started_at", "completed_at")
    list_filter = ("status",)


@admin.register(Digest)
class DigestAdmin(admin.ModelAdmin):
    list_display = ("user", "theme", "status", "created_at", "sent_at")
    list_filter = ("status",)
    search_fields = ("user__email", "theme__name")


@admin.register(DigestArticle)
class DigestArticleAdmin(admin.ModelAdmin):
    list_display = ("digest", "article", "relevance_score", "position")
    list_filter = ("digest__theme",)


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ("user", "digest", "status", "sent_at")
    list_filter = ("status",)
    search_fields = ("user__email",)


@admin.register(AIUsageLog)
class AIUsageLogAdmin(admin.ModelAdmin):
    list_display = ("feature", "model", "prompt_tokens", "completion_tokens", "total_tokens", "user", "created_at")
    list_filter = ("feature", "model")
    search_fields = ("user__email",)
    ordering = ("-created_at",)
