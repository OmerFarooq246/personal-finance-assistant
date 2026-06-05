from django.urls import path

from .views import ImportTransactionsCSVView, TransactionsView

urlpatterns = [
    path("", TransactionsView.as_view()),
    path("import-csv", ImportTransactionsCSVView.as_view()),
]
