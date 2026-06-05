from django.urls import path

from .views import BudgetsView

urlpatterns = [path("", BudgetsView.as_view())]
