from rest_framework import serializers

from .models import ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    session_id = serializers.IntegerField()

    class Meta:
        model = ChatMessage
        fields = ["id", "session_id", "role", "content", "metadata_json", "created_at", "updated_at"]


class ChatRequestSerializer(serializers.Serializer):
    chat_session_id = serializers.IntegerField()
    chat_msg = serializers.CharField()
