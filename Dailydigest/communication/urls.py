from django.urls import path
from . import views

urlpatterns = [
    path("posts/", views.social_posts_list, name="social-posts-list"),
    path("posts/calendar/", views.social_posts_calendar, name="social-posts-calendar"),
    path("posts/stats/", views.social_posts_stats, name="social-posts-stats"),
    path("posts/bulk/", views.social_post_bulk_action, name="social-posts-bulk"),
    path("posts/<int:post_id>/", views.social_post_detail, name="social-post-detail"),
    path("posts/<int:post_id>/update/", views.social_post_update, name="social-post-update"),
    path("posts/<int:post_id>/upload-image/", views.social_post_upload_image, name="social-post-upload-image"),
    path("posts/<int:post_id>/delete-image/", views.social_post_delete_image, name="social-post-delete-image"),
]
