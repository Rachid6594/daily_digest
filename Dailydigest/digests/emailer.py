"""
Envoi des digests par email aux utilisateurs.
Template HTML professionnel avec les articles selectionnes.
"""
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.utils.html import strip_tags

from digests.models import Digest, EmailLog

logger = logging.getLogger(__name__)


def send_digest_email(digest: Digest) -> bool:
    """Envoie un digest par email a l'utilisateur."""
    if digest.status != "ready":
        logger.warning(f"Digest {digest.id} n'est pas pret (status={digest.status})")
        return False

    items = digest.items.select_related("article").order_by("position")
    if not items.exists():
        logger.info(f"Digest {digest.id} vide, pas d'envoi")
        return False

    user = digest.user
    theme = digest.theme
    today = timezone.now().strftime("%A %d %B %Y")

    # Construire le HTML des articles
    articles_html = ""
    for item in items:
        article = item.article
        score_color = "#27ae60" if item.relevance_score >= 8 else "#e67e22" if item.relevance_score >= 6 else "#8a7060"
        articles_html += f"""
        <tr>
          <td style="padding: 20px 0; border-bottom: 1px solid #ede8df;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="36" valign="top" style="padding-right: 14px;">
                  <div style="background: #3d1f0a; color: #f2ece0; width: 32px; height: 32px; border-radius: 8px;
                              text-align: center; line-height: 32px; font-weight: 700; font-size: 14px;">
                    {item.position}
                  </div>
                </td>
                <td>
                  <a href="{article.url}" style="font-size: 16px; font-weight: 700; color: #3d1f0a;
                     text-decoration: none; line-height: 1.3;">{article.title}</a>
                  <p style="font-size: 13px; color: #8a7060; margin: 6px 0 8px; line-height: 1.5;">
                    {item.summary}
                  </p>
                  <span style="font-size: 11px; color: {score_color}; font-weight: 600;">
                    Pertinence: {item.relevance_score}/10
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        """

    subject = f"Votre DailyDigest — {theme.name} · {today}"

    html_message = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf8f4;">
      <!-- Header -->
      <div style="background: #3d1f0a; padding: 24px 32px; text-align: center;">
        <div style="display: inline-block; color: #f2ece0; font-weight: 800; font-size: 22px;">
          DailyDigest
        </div>
      </div>

      <!-- Content -->
      <div style="padding: 32px;">
        <h1 style="font-size: 22px; color: #3d1f0a; margin: 0 0 8px;">
          Bonjour {user.username} !
        </h1>
        <p style="font-size: 14px; color: #8a7060; margin: 0 0 24px;">
          Voici vos <strong>{items.count()} articles</strong> les plus pertinents
          sur le theme <strong>{theme.name}</strong>.
        </p>

        <!-- Articles -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
          {articles_html}
        </table>

        <!-- CTA -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="{settings.FRONTEND_URL}#/home"
             style="display: inline-block; background: #a0542a; color: #fff; padding: 12px 32px;
                    border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 14px;">
            Voir mon dashboard
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 20px 32px; background: #f0ebe3; text-align: center;">
        <p style="font-size: 11px; color: #b8a898; margin: 0;">
          DailyDigest — L'actualite curatee par IA, chaque matin.<br>
          <a href="{settings.FRONTEND_URL}" style="color: #a0542a; text-decoration: none;">dailydigest.ai</a>
        </p>
      </div>
    </div>
    """

    plain_message = strip_tags(html_message)

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

        # Marquer comme envoye
        digest.status = "sent"
        digest.sent_at = timezone.now()
        digest.save(update_fields=["status", "sent_at"])

        # Log
        EmailLog.objects.create(
            user=user,
            digest=digest,
            subject=subject,
            status="sent",
        )

        logger.info(f"Email envoye a {user.email} pour digest {digest.id}")
        return True

    except Exception as e:
        EmailLog.objects.create(
            user=user,
            digest=digest,
            subject=subject,
            status="failed",
            error_message=str(e)[:500],
        )
        logger.error(f"Erreur envoi email a {user.email}: {e}")
        return False


def send_all_pending_digests():
    """Envoie tous les digests en status 'ready'."""
    digests = Digest.objects.filter(status="ready").select_related("user", "theme")
    sent = 0
    failed = 0

    for digest in digests:
        if send_digest_email(digest):
            sent += 1
        else:
            failed += 1

    logger.info(f"Envoi termine: {sent} envoyes, {failed} echoues")
    return {"sent": sent, "failed": failed}


def send_digests_respecting_user_time():
    """
    Envoie les digests 'ready' si c'est l'heure preferee de l'utilisateur.
    Concu pour etre appele toutes les heures par Celery Beat.
    """
    from datetime import datetime

    digests = Digest.objects.filter(status="ready").select_related("user", "theme")
    sent = 0
    failed = 0
    skipped = 0

    current_time = timezone.now().time()

    for digest in digests:
        user_preferred_time = digest.user.preferred_time

        # Vérifier si on est dans l'heure préférée (tolerance de 1 heure)
        # Ex: si preferred_time = 07:00, on envoie entre 07:00 et 07:59
        hour_match = (current_time.hour == user_preferred_time.hour)

        if hour_match:
            if send_digest_email(digest):
                sent += 1
            else:
                failed += 1
        else:
            skipped += 1
            logger.debug(f"Digest {digest.id} skip: utilisateur prefer {user_preferred_time}, current {current_time.time()}")

    logger.info(f"Envoi avec verification heure: {sent} envoyes, {failed} echoues, {skipped} ignores")
    return {"sent": sent, "failed": failed, "skipped": skipped}
