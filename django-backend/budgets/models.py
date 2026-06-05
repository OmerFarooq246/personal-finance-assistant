from django.db import models
from django.utils import timezone


class BudgetPeriod(models.TextChoices):
    WEEKLY = "WEEKLY", "WEEKLY"
    MONTHLY = "MONTHLY", "MONTHLY"
    YEARLY = "YEARLY", "YEARLY"


class Budget(models.Model):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, db_column="user_id", related_name="budgets")
    category = models.CharField(max_length=255, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default="PKR")
    period = models.CharField(max_length=20, choices=BudgetPeriod.choices, default=BudgetPeriod.MONTHLY)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "budgets"

    def __str__(self):
        return f"{self.category or 'Budget'} {self.amount} {self.currency}"
