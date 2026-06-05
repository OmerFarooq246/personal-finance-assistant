from django.urls import path

from .views import ChatSessionsView

urlpatterns = [path("", ChatSessionsView.as_view())]
