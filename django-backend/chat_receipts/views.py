from decimal import Decimal

from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from core.file_upload import save_upload_file
from services.finance import extract_receipt_details
from transactions.models import Transaction, TransactionSource, TransactionType
from transactions.serializers import TransactionSerializer
from .models import Receipt
from .serializers import (
    CreateTransactionFromReceiptResponseSerializer,
    ReceiptSerializer,
    ReceiptUploadSerializer,
)


def _is_supported_receipt_file(content_type: str | None) -> bool:
    return bool(content_type) and (content_type == "application/pdf" or content_type.startswith("image/"))


def _build_transaction_entries(receipt_data: dict, fallback_amount: Decimal | None = None) -> list[dict]:
    transactions = receipt_data.get("transactions") or []
    if transactions:
        return transactions

    amount = receipt_data.get("total_amount") or fallback_amount
    if amount is None:
        return []

    return [
        {
            "amount": amount,
            "currency": receipt_data.get("currency", "PKR"),
            "transaction_date": receipt_data.get("transaction_date"),
            "category": receipt_data.get("category"),
            "merchant": receipt_data.get("merchant"),
            "description": receipt_data.get("description"),
        }
    ]


class ReceiptsView(APIView):
    serializer_class = ReceiptSerializer

    @extend_schema(responses=ReceiptSerializer(many=True))
    def get(self, request):
        receipts = Receipt.objects.filter(user=request.user)
        return Response(ReceiptSerializer(receipts, many=True).data)


class UploadReceiptView(APIView):
    serializer_class = ReceiptUploadSerializer
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(request=ReceiptUploadSerializer, responses=ReceiptSerializer)
    def post(self, request):
        upload = request.FILES.get("file")
        if not upload:
            raise ValidationError("Receipt file was not provided.")

        if not _is_supported_receipt_file(upload.content_type):
            return Response(
                {"detail": "Receipt upload must be an image or PDF file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        saved_path = save_upload_file(upload, "receipts")
        if saved_path == "img was not saved successfully":
            return Response(
                {"detail": "Receipt file was not saved successfully."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        receipt_data = extract_receipt_details(
            current_user=request.user,
            file_path=saved_path,
            mime_type=upload.content_type,
        )
        return Response(receipt_data, status=status.HTTP_201_CREATED)


class CreateTransactionFromReceiptView(APIView):
    serializer_class = CreateTransactionFromReceiptResponseSerializer

    @extend_schema(responses=CreateTransactionFromReceiptResponseSerializer)
    def post(self, request, receipt_id: int):
        receipt = Receipt.objects.filter(id=receipt_id, user=request.user).first()
        if not receipt:
            return Response({"created": False, "reason": "receipt_not_found", "transactions": []})

        entries = _build_transaction_entries(receipt.extracted_data or {}, receipt.total_amount)
        if not entries:
            return Response({"created": False, "reason": "missing_receipt_transactions", "transactions": []})

        created = []
        for entry in entries:
            transaction = Transaction.objects.create(
                user=request.user,
                receipt_id=receipt.id,
                type=TransactionType.EXPENSE,
                amount=Decimal(str(entry["amount"])),
                currency=entry.get("currency") or (receipt.extracted_data or {}).get("currency") or "PKR",
                source=TransactionSource.RECEIPT,
                category=entry.get("category") or (receipt.extracted_data or {}).get("category"),
                merchant=entry.get("merchant") or (receipt.extracted_data or {}).get("merchant"),
                description=entry.get("description") or (receipt.extracted_data or {}).get("description") or f"Receipt import: {receipt.file_name}",
                transaction_date=entry.get("transaction_date") or (receipt.extracted_data or {}).get("transaction_date") or timezone.now(),
            )
            created.append(transaction)

        return Response({"created": True, "transactions": TransactionSerializer(created, many=True).data})
