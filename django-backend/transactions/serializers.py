from rest_framework import serializers

from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    account_id = serializers.IntegerField(allow_null=True)
    receipt_id = serializers.IntegerField(allow_null=True)

    class Meta:
        model = Transaction
        fields = [
            "id",
            "account_id",
            "receipt_id",
            "type",
            "amount",
            "currency",
            "source",
            "external_id",
            "is_recurring",
            "category",
            "merchant",
            "description",
            "transaction_date",
            "created_at",
            "updated_at",
        ]


class TransactionFilterSerializer(serializers.Serializer):
    start_date = serializers.DateTimeField(required=False)
    end_date = serializers.DateTimeField(required=False)
    type = serializers.ChoiceField(choices=["INCOME", "EXPENSE", "TRANSFER"], required=False)
    category = serializers.CharField(required=False)
    merchant = serializers.CharField(required=False)
    account_id = serializers.IntegerField(required=False)
    currency = serializers.CharField(required=False)
    limit = serializers.IntegerField(required=False, default=50)
    offset = serializers.IntegerField(required=False, default=0)


class CSVImportSerializer(serializers.Serializer):
    file = serializers.FileField()
