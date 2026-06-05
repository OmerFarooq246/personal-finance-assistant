from rest_framework import serializers

from .models import Budget


class BudgetSerializer(serializers.ModelSerializer):

    class Meta:
        model = Budget
        fields = [
            "id",
            "category",
            "amount",
            "currency",
            "period",
            "start_date",
            "end_date",
            "created_at",
            "updated_at",
        ]
