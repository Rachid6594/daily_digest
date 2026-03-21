"""
URL configuration for Dailydigest project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from accounts.views_admin import (
    admin_stats_view, admin_users_view, admin_themes_view,
    admin_sources_view, admin_digests_view, admin_scrape_jobs_view,
    admin_run_pipeline_view, admin_pipeline_status_view,
    admin_curated_sources_view, admin_curated_source_detail_view,
    admin_ai_usage_view, admin_purge_view, admin_translate_keywords_view,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/themes/", include("themes.urls")),
    path("api/admin/stats/", admin_stats_view, name="admin-stats"),
    path("api/admin/users/", admin_users_view, name="admin-users"),
    path("api/admin/themes/", admin_themes_view, name="admin-themes"),
    path("api/admin/sources/", admin_sources_view, name="admin-sources"),
    path("api/admin/digests/", admin_digests_view, name="admin-digests"),
    path("api/admin/scrape-jobs/", admin_scrape_jobs_view, name="admin-scrape-jobs"),
    path("api/admin/run-pipeline/", admin_run_pipeline_view, name="admin-run-pipeline"),
    path("api/admin/pipeline-status/", admin_pipeline_status_view, name="admin-pipeline-status"),
    path("api/admin/pipeline-status/<int:run_id>/", admin_pipeline_status_view, name="admin-pipeline-status-detail"),
    path("api/admin/curated-sources/", admin_curated_sources_view, name="admin-curated-sources"),
    path("api/admin/curated-sources/<int:source_id>/", admin_curated_source_detail_view, name="admin-curated-source-detail"),
    path("api/admin/ai-usage/", admin_ai_usage_view, name="admin-ai-usage"),
    path("api/admin/purge/", admin_purge_view, name="admin-purge"),
    path("api/admin/translate-keywords/", admin_translate_keywords_view, name="admin-translate-keywords"),
    path("api/communication/", include("communication.urls")),
]
