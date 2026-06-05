from rest_framework import serializers

from .models import Receipt


class ReceiptSerializer(serializers.ModelSerializer):

    class Meta:
        model = Receipt
        fields = [
            "id",
            "file_name",
            "total_amount",
            "raw_text",
            "extracted_data",
            "processing_status",
            "created_at",
            "updated_at",
        ]


class ReceiptUploadSerializer(serializers.Serializer):
    file = serializers.FileField()


class ExtractedReceiptTransactionSerializer(serializers.Serializer):
    merchant = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(required=False, allow_null=True, allow_blank=True, default="PKR")
    transaction_date = serializers.DateTimeField(required=False, allow_null=True)
    category = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    description = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class ExtractedReceiptDataSerializer(serializers.Serializer):
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    transactions = ExtractedReceiptTransactionSerializer(many=True, required=False, default=list)
    raw_text = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    confidence = serializers.DecimalField(max_digits=4, decimal_places=3, required=False, allow_null=True)
    currency = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    transaction_date = serializers.DateTimeField(required=False, allow_null=True)
    merchant = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    category = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    description = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class CreateTransactionFromReceiptResponseSerializer(serializers.Serializer):
    created = serializers.BooleanField()
    reason = serializers.CharField(required=False, allow_null=True)
    transactions = serializers.ListField()
