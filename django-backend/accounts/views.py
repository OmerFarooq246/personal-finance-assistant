from rest_framework.generics import ListAPIView

from .models import Account
from .serializers import AccountSerializer


class AccountsView(ListAPIView):
    serializer_class = AccountSerializer

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)
