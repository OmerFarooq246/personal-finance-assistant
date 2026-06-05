from rest_framework import serializers

from .models import UserContext


class UserContextSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserContext
        fields = ["id", "context", "created_at", "updated_at"]
