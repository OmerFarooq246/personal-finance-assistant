from django.urls import path

from .views import CreateTransactionFromReceiptView, ReceiptsView, UploadReceiptView

urlpatterns = [
    path("", ReceiptsView.as_view()),
    path("upload", UploadReceiptView.as_view()),
    # path("<int:receipt_id>/create-transaction", CreateTransactionFromReceiptView.as_view()),
]
