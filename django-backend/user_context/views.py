from rest_framework.generics import ListAPIView

from .models import UserContext
from .serializers import UserContextSerializer


class UserContextView(ListAPIView):
    serializer_class = UserContextSerializer

    def get_queryset(self):
        return UserContext.objects.filter(user=self.request.user)
