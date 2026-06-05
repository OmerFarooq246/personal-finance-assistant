from django.urls import path

from .views import UserContextView

urlpatterns = [path("", UserContextView.as_view())]
