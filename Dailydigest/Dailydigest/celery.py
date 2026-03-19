"""
Configuration Celery pour DailyDigest.
"""
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Dailydigest.settings")

app = Celery("dailydigest")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
