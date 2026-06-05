from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from statistics import mean, pstdev
from typing import Any

from django.conf import settings
from django.db.models import Count, Max, Min, Sum, Value
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone

from accounts.models import Account
from accounts.serializers import AccountSerializer
from budgets.models import Budget
from budgets.serializers import BudgetSerializer
from chat_receipts.models import Receipt
from chat_receipts.serializers import ReceiptSerializer
from llm_calls.receipts import extract_receipt_file_with_gemini
from transactions.models import Transaction, TransactionSource, TransactionType
from transactions.serializers import TransactionSerializer
from user_context.models import UserContext
from user_context.serializers import UserContextSerializer


DEFAULT_CURRENCY = "PKR"
UNCATEGORIZED_CATEGORY = "Uncategorized"
UNKNOWN_MERCHANT = "Unknown"

BUDGET_STATUS_ARG_ERROR = (
    "Provide either budget_id or category to check a specific budget. "
    "Use get_all_budget_statuses to list available budgets first."
)
BUDGET_NOT_FOUND_ERROR = "No matching budget was found."


def _decimal(value: Any, default: str = "0") -> Decimal:
    if value is None:
        return Decimal(default)
    return Decimal(str(value))


def _json_safe(value: Any) -> Any:
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    return value


def _transaction_type(value: str | None) -> str | None:
    if value is None:
        return None
    return str(value).upper()


def _serialize_transaction(transaction: Transaction) -> dict[str, Any]:
    return dict(TransactionSerializer(transaction).data)


def _serialize_transactions(transactions) -> list[dict[str, Any]]:
    return TransactionSerializer(transactions, many=True).data


def _sum_amount(qs) -> Decimal:
    return qs.aggregate(total=Coalesce(Sum("amount"), Decimal("0")))["total"]


def _base_transactions(
    current_user,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    transaction_type: str | None = None,
    category: str | None = None,
    merchant: str | None = None,
    account_id: int | None = None,
    currency: str | None = None,
):
    qs = Transaction.objects.filter(user=current_user)

    if start_date:
        qs = qs.filter(transaction_date__gte=start_date)
    if end_date:
        qs = qs.filter(transaction_date__lte=end_date)
    if transaction_type:
        qs = qs.filter(type=_transaction_type(transaction_type))
    if category:
        qs = qs.filter(category__icontains=category)
    if merchant:
        qs = qs.filter(merchant__icontains=merchant)
    if account_id:
        qs = qs.filter(account_id=account_id)
    if currency:
        qs = qs.filter(currency=currency)

    return qs


def _receipt_data(receipt: Receipt) -> dict[str, Any]:
    extracted_data = receipt.extracted_data or {}
    if isinstance(extracted_data, list):
        return {"transactions": extracted_data}
    return extracted_data


def _single_receipt_transaction(receipt: Receipt, extracted_data: dict[str, Any]) -> dict[str, Any] | None:
    if receipt.total_amount is None:
        return None

    return {
        "amount": receipt.total_amount,
        "currency": extracted_data.get("currency", DEFAULT_CURRENCY),
        "transaction_date": extracted_data.get("transaction_date"),
        "category": extracted_data.get("category"),
        "merchant": extracted_data.get("merchant"),
        "description": extracted_data.get("description"),
    }


def _receipt_transaction_entries(receipt: Receipt, extracted_data: dict[str, Any]) -> list[dict[str, Any]]:
    transaction_entries = extracted_data.get("transactions") or []
    if transaction_entries:
        return transaction_entries

    fallback_entry = _single_receipt_transaction(receipt, extracted_data)
    return [fallback_entry] if fallback_entry else []


def _create_receipt_transaction(
    current_user,
    receipt: Receipt,
    extracted_data: dict[str, Any],
    entry: dict[str, Any],
) -> Transaction:
    return Transaction.objects.create(
        user=current_user,
        receipt=receipt,
        type=TransactionType.EXPENSE,
        amount=Decimal(str(entry["amount"])),
        currency=entry.get("currency") or extracted_data.get("currency") or DEFAULT_CURRENCY,
        source=TransactionSource.RECEIPT,
        external_id=entry.get("external_id"),
        is_recurring=False,
        category=entry.get("category") or extracted_data.get("category"),
        merchant=entry.get("merchant") or extracted_data.get("merchant"),
        description=(
            entry.get("description")
            or extracted_data.get("description")
            or f"Receipt import: {receipt.file_name}"
        ),
        transaction_date=entry.get("transaction_date") or extracted_data.get("transaction_date") or timezone.now(),
    )


def _create_receipt_transactions(
    current_user,
    receipt: Receipt,
    extracted_data: dict[str, Any],
) -> list[Transaction]:
    return [
        _create_receipt_transaction(current_user, receipt, extracted_data, entry)
        for entry in _receipt_transaction_entries(receipt, extracted_data)
    ]


def _receipt_file_path(file_path: str) -> Path:
    path = Path(file_path)
    return path if path.is_absolute() else settings.MEDIA_ROOT / path


def _store_receipt_extraction(receipt: Receipt, extracted_data: dict[str, Any]) -> None:
    receipt.total_amount = extracted_data.get("total_amount")
    receipt.raw_text = extracted_data.get("raw_text")
    receipt.extracted_data = _json_safe(extracted_data)
    receipt.processing_status = "PROCESSED"
    receipt.save()


def get_transactions(
    current_user,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    transaction_type: str | None = None,
    category: str | None = None,
    merchant: str | None = None,
    account_id: int | None = None,
    currency: str | None = None,
    limit: int = 25,
    offset: int = 0,
) -> dict[str, Any]:
    transactions = _base_transactions(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        transaction_type=transaction_type,
        category=category,
        merchant=merchant,
        account_id=account_id,
        currency=currency,
    ).order_by("-transaction_date")[offset : offset + limit]

    return {
        "transactions": _serialize_transactions(transactions),
        "limit": limit,
        "offset": offset,
    }


def get_total_spending(
    current_user,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    category: str | None = None,
    merchant: str | None = None,
    account_id: int | None = None,
    currency: str | None = None,
) -> dict[str, Any]:
    qs = _base_transactions(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        transaction_type=TransactionType.EXPENSE,
        category=category,
        merchant=merchant,
        account_id=account_id,
        currency=currency,
    )
    return {
        "total_spending": _sum_amount(qs),
        "currency": currency,
        "start_date": start_date,
        "end_date": end_date,
        "category": category,
        "merchant": merchant,
    }


def get_spending_by_category(
    current_user,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    currency: str | None = None,
    limit: int = 10,
) -> dict[str, Any]:
    qs = _base_transactions(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        transaction_type=TransactionType.EXPENSE,
        currency=currency,
    )
    rows = (
        qs.annotate(category_label=Coalesce("category", Value(UNCATEGORIZED_CATEGORY)))
        .values("category_label")
        .annotate(total=Coalesce(Sum("amount"), Decimal("0")))
        .order_by("-total")[:limit]
    )
    return {
        "categories": [{"category": row["category_label"], "total": row["total"]} for row in rows],
        "start_date": start_date,
        "end_date": end_date,
    }


def get_spending_by_merchant(
    current_user,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    category: str | None = None,
    merchant: str | None = None,
    currency: str | None = None,
    limit: int = 10,
) -> dict[str, Any]:
    qs = _base_transactions(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        transaction_type=TransactionType.EXPENSE,
        category=category,
        merchant=merchant,
        currency=currency,
    )
    rows = (
        qs.annotate(merchant_label=Coalesce("merchant", Value(UNKNOWN_MERCHANT)))
        .values("merchant_label")
        .annotate(total=Coalesce(Sum("amount"), Decimal("0")))
        .order_by("-total")[:limit]
    )
    return {
        "merchants": [{"merchant": row["merchant_label"], "total": row["total"]} for row in rows],
        "start_date": start_date,
        "end_date": end_date,
        "category": category,
    }


def get_biggest_transactions(
    current_user,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    category: str | None = None,
    merchant: str | None = None,
    currency: str | None = None,
    limit: int = 10,
) -> dict[str, Any]:
    transactions = _base_transactions(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        transaction_type=TransactionType.EXPENSE,
        category=category,
        merchant=merchant,
        currency=currency,
    ).order_by("-amount")[:limit]
    return {"transactions": _serialize_transactions(transactions)}


def get_income_summary(
    current_user,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    currency: str | None = None,
) -> dict[str, Any]:
    qs = _base_transactions(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        transaction_type=TransactionType.INCOME,
        currency=currency,
    )
    return {
        "total_income": _sum_amount(qs),
        "currency": currency,
        "start_date": start_date,
        "end_date": end_date,
    }


def get_cashflow_summary(
    current_user,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    currency: str | None = None,
) -> dict[str, Any]:
    income = get_income_summary(current_user, start_date, end_date, currency)
    spending = get_total_spending(current_user, start_date, end_date, currency=currency)
    total_income = _decimal(income["total_income"])
    total_spending = _decimal(spending["total_spending"])
    return {
        "total_income": total_income,
        "total_spending": total_spending,
        "net_cashflow": total_income - total_spending,
        "currency": currency,
        "start_date": start_date,
        "end_date": end_date,
    }


def get_monthly_spending_comparison(
    current_user,
    current_start_date: datetime,
    current_end_date: datetime,
    comparison_start_date: datetime,
    comparison_end_date: datetime,
    category: str | None = None,
    currency: str | None = None,
) -> dict[str, Any]:
    current = get_total_spending(
        current_user,
        current_start_date,
        current_end_date,
        category=category,
        currency=currency,
    )
    comparison = get_total_spending(
        current_user,
        comparison_start_date,
        comparison_end_date,
        category=category,
        currency=currency,
    )
    current_total = _decimal(current["total_spending"])
    comparison_total = _decimal(comparison["total_spending"])
    difference = current_total - comparison_total
    return {
        "current_total": current_total,
        "comparison_total": comparison_total,
        "difference": difference,
        "percent_change": None if comparison_total == 0 else (difference / comparison_total) * Decimal("100"),
        "category": category,
        "currency": currency,
    }


def get_category_spending_trend(
    current_user,
    category: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    currency: str | None = None,
) -> dict[str, Any]:
    qs = _base_transactions(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        transaction_type=TransactionType.EXPENSE,
        category=category,
        currency=currency,
    )
    rows = (
        qs.annotate(
            month=TruncMonth("transaction_date"),
            category_label=Coalesce("category", Value(UNCATEGORIZED_CATEGORY)),
        )
        .values("month", "category_label")
        .annotate(total=Coalesce(Sum("amount"), Decimal("0")))
        .order_by("month")
    )
    return {
        "trend": [{"month": row["month"], "category": row["category_label"], "total": row["total"]} for row in rows],
        "category": category,
    }


def get_merchant_spending_trend(
    current_user,
    merchant: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    currency: str | None = None,
) -> dict[str, Any]:
    qs = _base_transactions(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        transaction_type=TransactionType.EXPENSE,
        merchant=merchant,
        currency=currency,
    )
    rows = (
        qs.annotate(
            month=TruncMonth("transaction_date"),
            merchant_label=Coalesce("merchant", Value(UNKNOWN_MERCHANT)),
        )
        .values("month", "merchant_label")
        .annotate(total=Coalesce(Sum("amount"), Decimal("0")))
        .order_by("month")
    )
    return {
        "trend": [{"month": row["month"], "merchant": row["merchant_label"], "total": row["total"]} for row in rows],
        "merchant": merchant,
    }


def get_financial_summary_data(
    current_user,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    currency: str | None = None,
) -> dict[str, Any]:
    top_categories = get_spending_by_category(
        current_user,
        start_date,
        end_date,
        currency,
        limit=5,
    )["categories"]
    return {
        "cashflow": get_cashflow_summary(current_user, start_date, end_date, currency),
        "top_categories": top_categories,
        "top_merchants": get_spending_by_merchant(
            current_user,
            start_date,
            end_date,
            currency=currency,
            limit=5,
        )["merchants"],
    }


def detect_recurring_transactions(
    current_user,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    min_occurrences: int = 3,
    currency: str | None = None,
) -> dict[str, Any]:
    qs = _base_transactions(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        transaction_type=TransactionType.EXPENSE,
        currency=currency,
    ).exclude(merchant__isnull=True)
    rows = (
        qs.values("merchant", "amount", "currency")
        .annotate(
            occurrences=Count("id"),
            first_seen=Min("transaction_date"),
            last_seen=Max("transaction_date"),
        )
        .filter(occurrences__gte=min_occurrences)
        .order_by("-occurrences")
    )
    return {
        "recurring_transactions": [
            {
                "merchant": row["merchant"],
                "amount": row["amount"],
                "currency": row["currency"],
                "occurrences": row["occurrences"],
                "first_seen": row["first_seen"],
                "last_seen": row["last_seen"],
            }
            for row in rows
        ]
    }


def detect_unusual_transactions(
    current_user,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    threshold_stddevs: float = 2.0,
    limit: int = 10,
) -> dict[str, Any]:
    transactions = list(
        _base_transactions(
            current_user=current_user,
            start_date=start_date,
            end_date=end_date,
            transaction_type=TransactionType.EXPENSE,
        ).order_by("-transaction_date")
    )
    amounts_by_category: dict[str, list[Decimal]] = {}
    for transaction in transactions:
        amounts_by_category.setdefault(transaction.category or UNCATEGORIZED_CATEGORY, []).append(transaction.amount)

    unusual = []
    for transaction in transactions:
        key = transaction.category or UNCATEGORIZED_CATEGORY
        amounts = amounts_by_category[key]
        if len(amounts) < 3:
            continue
        average = Decimal(str(mean(amounts)))
        deviation = Decimal(str(pstdev(amounts)))
        threshold = average + deviation * Decimal(str(threshold_stddevs))
        if deviation > 0 and transaction.amount >= threshold:
            unusual.append(
                {
                    "transaction": _serialize_transaction(transaction),
                    "category_average": average,
                    "threshold_stddevs": Decimal(str(threshold_stddevs)),
                }
            )
    return {"unusual_transactions": unusual[:limit], "threshold_stddevs": Decimal(str(threshold_stddevs))}


def lookup_merchant_from_transactions(current_user, merchant: str, limit: int = 10) -> dict[str, Any]:
    transactions = get_transactions(current_user=current_user, merchant=merchant, limit=limit)
    summary = get_spending_by_merchant(current_user=current_user, merchant=merchant, limit=limit)
    return {
        "merchant": merchant,
        "matches": summary["merchants"],
        "recent_transactions": transactions["transactions"],
    }


def get_cutback_suggestions_data(
    current_user,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    currency: str | None = None,
) -> dict[str, Any]:
    top_categories = get_spending_by_category(
        current_user,
        start_date,
        end_date,
        currency,
        limit=10,
    )["categories"]
    return {
        "top_categories": top_categories,
        "top_merchants": get_spending_by_merchant(
            current_user,
            start_date,
            end_date,
            currency=currency,
            limit=10,
        )["merchants"],
        "recurring_transactions": detect_recurring_transactions(current_user, start_date, end_date, currency=currency)[
            "recurring_transactions"
        ],
    }


def get_budget_status(current_user, budget_id: int | None = None, category: str | None = None) -> dict[str, Any]:
    if budget_id:
        budget = Budget.objects.filter(id=budget_id, user=current_user).first()
    elif category:
        budget = Budget.objects.filter(user=current_user, category__icontains=category).order_by("-created_at").first()
    else:
        return {"error": BUDGET_STATUS_ARG_ERROR}

    if not budget:
        return {"error": BUDGET_NOT_FOUND_ERROR}

    spending = get_total_spending(
        current_user=current_user,
        start_date=budget.start_date,
        end_date=budget.end_date,
        category=budget.category,
        currency=budget.currency,
    )
    spent = _decimal(spending["total_spending"])
    remaining = budget.amount - spent
    return {
        "budget": BudgetSerializer(budget).data,
        "spent": spent,
        "remaining": remaining,
        "percent_used": None if budget.amount == 0 else (spent / budget.amount) * Decimal("100"),
        "start_date": budget.start_date,
        "end_date": budget.end_date,
    }


def get_all_budget_statuses(current_user) -> list[dict[str, Any]]:
    budgets = Budget.objects.filter(user=current_user).order_by("-created_at")
    return [get_budget_status(current_user=current_user, budget_id=budget.id) for budget in budgets]


def get_budget_alerts(current_user, threshold_percent: Decimal = Decimal("80")) -> dict[str, Any]:
    threshold_percent = Decimal(str(threshold_percent))
    alerts = [
        status
        for status in get_all_budget_statuses(current_user)
        if status.get("percent_used") is not None and status["percent_used"] >= threshold_percent
    ]
    return {"alerts": alerts, "threshold_percent": threshold_percent}


def get_accounts_summary(current_user) -> dict[str, Any]:
    accounts = Account.objects.filter(user=current_user)
    balances_by_currency: dict[str, Decimal] = {}
    for account in accounts:
        current_balance = balances_by_currency.get(account.currency, Decimal("0"))
        balances_by_currency[account.currency] = current_balance + account.balance
    return {
        "accounts": AccountSerializer(accounts, many=True).data,
        "balances_by_currency": balances_by_currency,
    }


def create_transaction_from_receipt(current_user, receipt_id: int) -> dict[str, Any]:
    receipt = Receipt.objects.filter(id=receipt_id, user=current_user).first()
    if not receipt:
        return {"created": False, "reason": "receipt_not_found", "transactions": []}

    existing_transactions = receipt.transactions.all()
    if existing_transactions.exists():
        return {"created": True, "transactions": _serialize_transactions(existing_transactions)}

    extracted_data = _receipt_data(receipt)
    transaction_entries = _receipt_transaction_entries(receipt, extracted_data)
    if not transaction_entries:
        return {"created": False, "reason": "missing_receipt_transactions", "transactions": []}

    created_transactions = _create_receipt_transactions(current_user, receipt, extracted_data)

    return {"created": True, "transactions": _serialize_transactions(created_transactions)}


def extract_receipt_details(current_user, file_path: str, mime_type: str) -> dict[str, Any]:
    receipt = Receipt.objects.create(
        user=current_user,
        file_name=file_path,
        processing_status="PROCESSING",
    )

    try:
        with open(_receipt_file_path(file_path), "rb") as f:
            file_bytes = f.read()

        extracted_data_model = extract_receipt_file_with_gemini(file_bytes=file_bytes, mime_type=mime_type)
        extracted_data = extracted_data_model.model_dump(exclude_none=True)
        _store_receipt_extraction(receipt, extracted_data)
        _create_receipt_transactions(current_user, receipt, extracted_data)
    except Exception as e:
        receipt.extracted_data = {"error": str(e)}
        receipt.processing_status = "FAILED"
        receipt.save()

    return dict(ReceiptSerializer(receipt).data)


def lookup_merchant(current_user, merchant: str, limit: int = 10) -> dict[str, Any]:
    return lookup_merchant_from_transactions(current_user=current_user, merchant=merchant, limit=limit)


def get_user_context(current_user) -> dict[str, Any]:
    contexts = UserContext.objects.filter(user=current_user)
    return {"context": UserContextSerializer(contexts, many=True).data}


def save_user_context(current_user, context: str) -> dict[str, Any]:
    user_context = UserContext.objects.create(user=current_user, context=context)
    return {"saved": True, "context": UserContextSerializer(user_context).data}
