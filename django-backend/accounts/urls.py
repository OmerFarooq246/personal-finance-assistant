from django.urls import path

from .views import AccountsView

urlpatterns = [path("", AccountsView.as_view())]
