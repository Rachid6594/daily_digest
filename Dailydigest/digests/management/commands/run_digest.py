"""
Management command pour lancer le pipeline de generation de digests.
Usage: python manage.py run_digest
"""
from django.core.management.base import BaseCommand
from digests.pipeline import run_pipeline


class Command(BaseCommand):
    help = "Lance le pipeline complet: scrape, filtre, tri IA, creation des digests"

    def handle(self, *args, **options):
        self.stdout.write("Lancement du pipeline DailyDigest...")
        run_pipeline()
        self.stdout.write(self.style.SUCCESS("Pipeline termine avec succes."))
