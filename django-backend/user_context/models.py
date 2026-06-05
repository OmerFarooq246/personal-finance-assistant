from django.db import models
from django.utils import timezone


class UserContext(models.Model):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, db_column="user_id", related_name="context_items")
    context = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_context"

    def __str__(self):
        return self.context[:60]
