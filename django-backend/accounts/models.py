from django.db import models
from django.utils import timezone


class Account(models.Model):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, db_column="user_id", related_name="accounts")
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, default="bank")
    currency = models.CharField(max_length=10, default="PKR")
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "accounts"

    def __str__(self):
        return self.name
