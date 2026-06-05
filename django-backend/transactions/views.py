import csv
from pathlib import Path

from django.conf import settings
from django.db import IntegrityError
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from core.file_upload import save_upload_file
from llm_calls.transactions import parse_csv_rows_to_transactions
from .models import Transaction, TransactionSource
from .serializers import CSVImportSerializer, TransactionFilterSerializer, TransactionSerializer


def _filter_payload(request) -> dict:
    if request.query_params:
        return request.query_params
    return request.data if isinstance(request.data, dict) else {}


def _filtered_transactions(current_user_id: int, filters: dict):
    qs = Transaction.objects.filter(user_id=current_user_id)

    if filters.get("start_date"):
        qs = qs.filter(transaction_date__gte=filters["start_date"])
    if filters.get("end_date"):
        qs = qs.filter(transaction_date__lte=filters["end_date"])
    if filters.get("type"):
        qs = qs.filter(type=filters["type"])
    if filters.get("category"):
        qs = qs.filter(category__icontains=filters["category"])
    if filters.get("merchant"):
        qs = qs.filter(merchant__icontains=filters["merchant"])
    if filters.get("account_id"):
        qs = qs.filter(account_id=filters["account_id"])
    if filters.get("currency"):
        qs = qs.filter(currency=filters["currency"])

    limit = filters.get("limit", 50)
    offset = filters.get("offset", 0)
    return qs.order_by("-transaction_date")[offset : offset + limit]


class TransactionsView(APIView):
    serializer_class = TransactionSerializer

    @extend_schema(responses=TransactionSerializer(many=True))
    def get(self, request):
        serializer = TransactionFilterSerializer(data=_filter_payload(request))
        serializer.is_valid(raise_exception=True)
        transactions = _filtered_transactions(request.user.id, serializer.validated_data)
        return Response(TransactionSerializer(transactions, many=True).data)


class ImportTransactionsCSVView(APIView):
    serializer_class = CSVImportSerializer
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(request=CSVImportSerializer, responses=TransactionSerializer(many=True))
    def post(self, request):
        upload = request.FILES.get("file")
        if not upload:
            raise ValidationError("CSV file was not provided")

        saved_path = save_upload_file(upload, "transactions")
        if saved_path == "img was not saved successfully":
            raise APIException("CSV file was not saved successfully")

        with open(settings.MEDIA_ROOT / Path(saved_path), newline="", encoding="utf-8-sig") as f:
            raw_rows = list(csv.DictReader(f))

        created_transactions = []
        batch_size = int(settings.CSV_BATCH_SIZE)
        for start in range(0, len(raw_rows), batch_size):
            batch = raw_rows[start : start + batch_size]
            for row in parse_csv_rows_to_transactions(batch):
                external_id = row.external_id
                if external_id and Transaction.objects.filter(
                    user=request.user,
                    source=TransactionSource.CSV,
                    external_id=external_id,
                ).exists():
                    continue

                try:
                    transaction = Transaction.objects.create(
                        user=request.user,
                        account_id=row.account_id,
                        receipt_id=None,
                        type=row.type,
                        amount=row.amount,
                        currency=row.currency,
                        source=TransactionSource.CSV,
                        external_id=external_id,
                        is_recurring=False,
                        category=row.category,
                        merchant=row.merchant,
                        description=row.description,
                        transaction_date=row.transaction_date,
                    )
                    created_transactions.append(transaction)
                except IntegrityError:
                    continue

        return Response(TransactionSerializer(created_transactions, many=True).data, status=status.HTTP_201_CREATED)
