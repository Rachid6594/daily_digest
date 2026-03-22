from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from digests.models import UserEvent


@api_view(['POST'])
@permission_classes([AllowAny])
def track_event(request):
    """
    Enregistre un evenement utilisateur pour le funnel tracking.
    Body: {"event_type": "landing_visit", "session_id": "abc123", "extra_data": {...}}
    """
    event_type = request.data.get('event_type')
    session_id = request.data.get('session_id', '')
    extra_data = request.data.get('extra_data', {})

    if not event_type:
        return Response({'error': 'event_type required'}, status=status.HTTP_400_BAD_REQUEST)

    user = request.user if request.user.is_authenticated else None

    UserEvent.objects.create(
        user=user,
        event_type=event_type,
        session_id=session_id,
        extra_data=extra_data,
    )

    return Response({'status': 'tracked'}, status=status.HTTP_201_CREATED)
