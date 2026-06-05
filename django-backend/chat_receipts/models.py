from django.db import models
from django.utils import timezone


class ReceiptStatus(models.TextChoices):
    PROCESSING = "PROCESSING", "PROCESSING"
    PROCESSED = "PROCESSED", "PROCESSED"
    FAILED = "FAILED", "FAILED"
    NEEDS_REVIEW = "NEEDS_REVIEW", "NEEDS_REVIEW"


class Receipt(models.Model):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, db_column="user_id", related_name="receipts")
    file_name = models.CharField(max_length=500)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    raw_text = models.TextField(null=True, blank=True)
    extracted_data = models.JSONField(null=True, blank=True)
    processing_status = models.CharField(
        max_length=30,
        choices=ReceiptStatus.choices,
        default=ReceiptStatus.PROCESSING,
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "receipts"
        indexes = [models.Index(fields=["user"])]

    def __str__(self):
        return self.file_name
