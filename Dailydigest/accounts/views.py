from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
from django.core.signing import TimestampSigner, SignatureExpired, BadSignature
from django.conf import settings
from django.utils.html import strip_tags

from .serializers import RegisterSerializer, LoginSerializer

User = get_user_model()
signer = TimestampSigner()


def make_verification_token(user_id):
    return signer.sign(str(user_id))


def verify_token(token, max_age=86400):
    """Verifie le token (valide 24h)"""
    try:
        user_id = signer.unsign(token, max_age=max_age)
        return int(user_id)
    except (SignatureExpired, BadSignature):
        return None


def send_verification_email(user, request=None):
    """Envoie l'email de verification. Retourne le lien de verification."""
    token = make_verification_token(user.id)
    frontend_url = settings.FRONTEND_URL
    verify_url = f"{frontend_url}#/verify?token={token}"

    subject = "DailyDigest — Confirmez votre adresse email"
    html_message = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: #3d1f0a; border-radius: 10px; padding: 10px 14px; color: #f2ece0; font-weight: 800; font-size: 18px;">
                D
            </div>
            <span style="font-weight: 800; font-size: 20px; color: #3d1f0a; margin-left: 10px; vertical-align: middle;">DailyDigest</span>
        </div>

        <h1 style="font-size: 24px; color: #3d1f0a; text-align: center; margin-bottom: 16px;">
            Bienvenue, {user.username} !
        </h1>

        <p style="font-size: 15px; color: #8a7060; text-align: center; line-height: 1.6; margin-bottom: 32px;">
            Merci de vous etre inscrit sur DailyDigest.<br>
            Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et activer votre compte.
        </p>

        <div style="text-align: center; margin-bottom: 32px;">
            <a href="{verify_url}"
               style="display: inline-block; background: #a0542a; color: #fff; padding: 14px 40px;
                      border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 15px;">
                Confirmer mon email
            </a>
        </div>

        <p style="font-size: 12px; color: #8a7060; text-align: center; line-height: 1.5;">
            Ce lien expire dans 24 heures.<br>
            Si vous n'avez pas cree de compte, ignorez cet email.
        </p>

        <hr style="border: none; border-top: 1px solid #ddd4c4; margin: 32px 0 16px;">
        <p style="font-size: 11px; color: #b8a898; text-align: center;">
            DailyDigest — L'actualite curatee par IA, chaque matin.
        </p>
    </div>
    """
    plain_message = strip_tags(html_message)

    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )

    return verify_url


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        verify_url = send_verification_email(user, request)
        response_data = {
            "message": "Compte cree ! Verifiez votre boite mail pour activer votre compte.",
        }
        # En mode dev, inclure le lien de verification dans la reponse
        if settings.DEBUG:
            response_data["verify_url"] = verify_url
        return Response(response_data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "Email ou mot de passe incorrect."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user_obj.check_password(password):
            return Response(
                {"error": "Email ou mot de passe incorrect."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user_obj.is_active:
            return Response(
                {"error": "Votre compte n'est pas encore active. Verifiez votre boite mail."},
                status=status.HTTP_403_FORBIDDEN
            )

        user = user_obj

        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "Connexion reussie.",
            "tokens": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "language": user.language,
                "is_admin": user.is_staff or user.is_superuser,
            }
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email_view(request):
    token = request.GET.get('token')
    if not token:
        return Response(
            {"error": "Token manquant."},
            status=status.HTTP_400_BAD_REQUEST
        )

    user_id = verify_token(token)
    if user_id is None:
        return Response(
            {"error": "Lien invalide ou expire. Demandez un nouveau lien."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"error": "Utilisateur introuvable."},
            status=status.HTTP_404_NOT_FOUND
        )

    if user.is_active:
        return Response({"message": "Votre compte est deja active."})

    user.is_active = True
    user.save()
    return Response({"message": "Email confirme ! Vous pouvez maintenant vous connecter."})


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification_view(request):
    email = request.data.get('email')
    if not email:
        return Response(
            {"error": "Email requis."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Ne pas reveler si l'email existe ou non
        return Response({"message": "Si ce compte existe, un email de verification a ete envoye."})

    if user.is_active:
        return Response({"message": "Ce compte est deja active."})

    send_verification_email(user, request)
    return Response({"message": "Si ce compte existe, un email de verification a ete envoye."})


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user

    if request.method == 'PATCH':
        if 'preferred_time' in request.data:
            user.preferred_time = request.data['preferred_time']
        if 'language' in request.data:
            user.language = request.data['language']
        user.save()

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "language": user.language,
        "preferred_time": str(user.preferred_time),
        "is_admin": user.is_staff or user.is_superuser,
        "date_joined": user.date_joined.isoformat(),
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def google_oauth_view(request):
    """Connexion/inscription via Google. Recoit le credential (ID token) du frontend."""
    import json
    import logging
    from urllib.request import urlopen

    logger = logging.getLogger(__name__)

    credential = request.data.get('credential')
    if not credential:
        return Response({"error": "Token Google manquant."}, status=status.HTTP_400_BAD_REQUEST)

    google_client_id = settings.GOOGLE_CLIENT_ID
    logger.info(f"Google Client ID from settings: {google_client_id[:20]}..." if google_client_id else "Google Client ID: NOT SET")

    if not google_client_id:
        return Response({"error": "Google OAuth non configure."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        # Decoder le JWT Google sans verification (on verifie manuellement)
        import base64
        parts = credential.split(".")
        if len(parts) != 3:
            raise ValueError("Token invalide")

        # Decoder le payload (partie 2)
        payload = parts[1]
        payload += "=" * (4 - len(payload) % 4)  # padding base64
        decoded = json.loads(base64.urlsafe_b64decode(payload))

        logger.info(f"Token audience: {decoded.get('aud')}")
        logger.info(f"Expected client_id: {google_client_id}")

        # Verifier l'audience (client_id)
        if decoded.get("aud") != google_client_id:
            return Response({"error": "Token Google invalide (audience)."}, status=status.HTTP_401_UNAUTHORIZED)

        # Verifier l'issuer
        if decoded.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
            return Response({"error": "Token Google invalide (issuer)."}, status=status.HTTP_401_UNAUTHORIZED)

        # Verifier l'expiration
        import time
        if decoded.get("exp", 0) < time.time():
            return Response({"error": "Token Google expire."}, status=status.HTTP_401_UNAUTHORIZED)

        email = decoded.get("email")
        if not email:
            return Response({"error": "Email non fourni par Google."}, status=status.HTTP_400_BAD_REQUEST)

        email_verified = decoded.get("email_verified", False)
        given_name = decoded.get("given_name", "")
        family_name = decoded.get("family_name", "")
        name = decoded.get("name", given_name)

    except Exception as e:
        return Response({"error": f"Token Google invalide: {str(e)[:100]}"}, status=status.HTTP_401_UNAUTHORIZED)

    # Chercher ou creer l'utilisateur
    try:
        user = User.objects.get(email=email)
        # Utilisateur existe — activer si pas actif (Google a verifie l'email)
        if not user.is_active:
            user.is_active = True
            user.save(update_fields=["is_active"])
    except User.DoesNotExist:
        # Creer un nouvel utilisateur
        username = email.split("@")[0]
        # Eviter les doublons de username
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        user = User.objects.create_user(
            username=username,
            email=email,
            password=None,  # Pas de mot de passe pour les comptes Google
            is_active=True,  # Pas besoin de verification email
        )

    # Generer les JWT
    refresh = RefreshToken.for_user(user)
    return Response({
        "message": "Connexion Google reussie.",
        "tokens": {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        },
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "language": user.language,
            "is_admin": user.is_staff or user.is_superuser,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
    except Exception:
        pass
    return Response({"message": "Deconnexion reussie."})
