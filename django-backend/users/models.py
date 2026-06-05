from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserRole(models.TextChoices):
    SUPER_ADMIN = "SUPER_ADMIN", "SUPER_ADMIN"
    USER = "USER", "USER"


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The email address must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.SUPER_ADMIN)

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = None
    full_name = models.CharField(max_length=255, null=True, blank=True)
    email = models.CharField(max_length=50, unique=True, db_index=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.USER)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        db_table = "users"

    @property
    def created_at(self):
        return self.date_joined

    def __str__(self):
        return self.email
