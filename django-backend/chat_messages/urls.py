from django.urls import path

from .views import ChatMessagesView, ChatView

urlpatterns = [
    path("chat", ChatView.as_view()),
    path("<int:chat_session_id>", ChatMessagesView.as_view()),
]
