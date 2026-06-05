from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from .models import User


class CreateUserSerializer(serializers.ModelSerializer):
    email = serializers.CharField(min_length=3, max_length=50)
    full_name = serializers.CharField(min_length=1, max_length=255)
    password = serializers.CharField(min_length=8, write_only=True)

    class Meta:
        model = User
        fields = ["email", "full_name", "password"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UpdateUserSerializer(serializers.ModelSerializer):
    email = serializers.CharField(min_length=3, max_length=50, required=False)
    password = serializers.CharField(min_length=8, required=False, write_only=True)

    class Meta:
        model = User
        fields = ["email", "password", "role"]

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UserResponseSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(source="date_joined", read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "role", "created_at"]


class UserLoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField()


class FastAPICompatibleTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        return {
            "access_token": data["access"],
            "refresh_token": data.get("refresh", attrs["refresh"]),
            "token_type": "bearer",
        }
