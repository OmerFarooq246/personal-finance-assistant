from django.db import models
from django.utils import timezone


class TransactionType(models.TextChoices):
    INCOME = "INCOME", "INCOME"
    EXPENSE = "EXPENSE", "EXPENSE"
    TRANSFER = "TRANSFER", "TRANSFER"


class TransactionSource(models.TextChoices):
    MANUAL = "MANUAL", "MANUAL"
    CSV = "CSV", "CSV"
    MOCK_BANK = "MOCK_BANK", "MOCK_BANK"
    RECEIPT = "RECEIPT", "RECEIPT"
    ASSISTANT = "ASSISTANT", "ASSISTANT"


class Transaction(models.Model):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, db_column="user_id", related_name="transactions")
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.SET_NULL,
        db_column="account_id",
        related_name="transactions",
        null=True,
        blank=True,
    )
    receipt = models.ForeignKey(
        "chat_receipts.Receipt",
        on_delete=models.SET_NULL,
        db_column="receipt_id",
        related_name="transactions",
        null=True,
        blank=True,
    )
    type = models.CharField(max_length=20, choices=TransactionType.choices, default=TransactionType.EXPENSE, db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default="PKR")
    source = models.CharField(max_length=20, choices=TransactionSource.choices, default=TransactionSource.CSV)
    external_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    is_recurring = models.BooleanField(default=False)
    category = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    merchant = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    description = models.TextField(null=True, blank=True)
    transaction_date = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "transactions"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "source", "external_id"],
                name="uq_user_source_external_id",
            )
        ]

    def __str__(self):
        return f"{self.type} {self.amount} {self.currency}"
