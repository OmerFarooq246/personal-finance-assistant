from rest_framework.generics import ListAPIView

from .models import ChatSession
from .serializers import ChatSessionSerializer


class ChatSessionsView(ListAPIView):
    serializer_class = ChatSessionSerializer

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)
