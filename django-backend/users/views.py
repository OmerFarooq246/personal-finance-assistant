from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.utils import extend_schema

from core.permissions import IsSuperAdmin
from .models import User
from .serializers import (
    CreateUserSerializer,
    FastAPICompatibleTokenRefreshSerializer,
    UpdateUserSerializer,
    UserLoginSerializer,
    UserResponseSerializer,
)


def _tokens_for_user(user: User) -> tuple[str, str]:
    refresh = RefreshToken.for_user(user)
    refresh["sub"] = str(user.id)
    refresh["email"] = user.email
    refresh["role"] = user.role
    refresh.access_token["sub"] = str(user.id)
    refresh.access_token["email"] = user.email
    refresh.access_token["role"] = user.role
    return str(refresh.access_token), str(refresh)


def _login_response(user: User) -> dict:
    access_token, refresh_token = _tokens_for_user(user)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponseSerializer(user).data,
    }


class UsersView(ListCreateAPIView):
    queryset = User.objects.order_by("id")

    def get_permissions(self):
        if self.request.method == "POST":
            return [AllowAny()]
        return [IsSuperAdmin()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateUserSerializer
        return UserResponseSerializer

    def list(self, request, *args, **kwargs):
        if not self.get_queryset().exists():
            return Response(status=status.HTTP_204_NO_CONTENT)
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserResponseSerializer(user).data, status=status.HTTP_201_CREATED)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserResponseSerializer

    @extend_schema(responses=UserResponseSerializer)
    def get(self, request):
        return Response(UserResponseSerializer(request.user).data)


class UserDetailView(RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UpdateUserSerializer
    permission_classes = [IsSuperAdmin]
    lookup_url_kwarg = "user_id"
    http_method_names = ["patch", "delete"]

    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserResponseSerializer(user).data)


class LoginView(APIView):
    permission_classes = [AllowAny]
    serializer_class = UserLoginSerializer

    @extend_schema(request=UserLoginSerializer, responses=UserResponseSerializer)
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        if not user:
            from rest_framework.exceptions import AuthenticationFailed

            raise AuthenticationFailed("error in authenticate: incorrect password")

        return Response(_login_response(user))


class RefreshTokenView(TokenRefreshView):
    permission_classes = [AllowAny]
    serializer_class = FastAPICompatibleTokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        data = request.data.copy()
        if "refresh" not in data and "refresh_token" in data:
            data["refresh"] = data["refresh_token"]
        if "refresh" not in data and "refresh_token" in request.query_params:
            data["refresh"] = request.query_params["refresh_token"]

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)
