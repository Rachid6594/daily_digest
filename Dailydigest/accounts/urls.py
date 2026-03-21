from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('verify-email/', views.verify_email_view, name='verify-email'),
    path('resend-verification/', views.resend_verification_view, name='resend-verification'),
    path('me/', views.me_view, name='me'),
    path('logout/', views.logout_view, name='logout'),
    path('google-oauth/', views.google_oauth_view, name='google-oauth'),
]
