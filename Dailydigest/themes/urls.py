from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_themes, name='list-themes'),
    path('suggest/', views.suggest_themes, name='suggest-themes'),
    path('suggest-sources/', views.suggest_sources, name='suggest-sources'),
    path('match-curated/', views.match_curated_sources, name='match-curated'),
    path('create/', views.create_theme, name='create-theme'),
    path('<int:theme_id>/delete/', views.delete_theme, name='delete-theme'),
]
