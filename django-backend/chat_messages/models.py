from django.db import models
from django.utils import timezone


class ChatRole(models.TextChoices):
    USER = "USER", "USER"
    ASSISTANT = "ASSISTANT", "ASSISTANT"


class ChatMessage(models.Model):
    session = models.ForeignKey(
        "chat_sessions.ChatSession",
        on_delete=models.CASCADE,
        db_column="session_id",
        related_name="messages",
    )
    role = models.CharField(max_length=20, choices=ChatRole.choices, default=ChatRole.USER)
    content = models.TextField()
    metadata_json = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chat_messages"

    def __str__(self):
        return f"{self.role}: {self.content[:40]}"
