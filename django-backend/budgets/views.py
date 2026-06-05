from rest_framework.generics import ListAPIView

from .models import Budget
from .serializers import BudgetSerializer


class BudgetsView(ListAPIView):
    serializer_class = BudgetSerializer

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)
