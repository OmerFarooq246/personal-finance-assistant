from django.urls import path

from .views import CurrentUserView, UserDetailView, UsersView

urlpatterns = [
    path("", UsersView.as_view()),
    path("me", CurrentUserView.as_view()),
    # path("<int:user_id>", UserDetailView.as_view()),
]
