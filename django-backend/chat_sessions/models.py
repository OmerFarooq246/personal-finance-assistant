from django.db import models
from django.utils import timezone


class ChatSession(models.Model):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, db_column="user_id", related_name="chat_sessions")
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chat_sessions"

    def __str__(self):
        return self.title
