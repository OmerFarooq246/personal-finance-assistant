from google import genai
from google.genai import types
from django.conf import settings

from .schemas import ExtractedReceiptDataSchema


def extract_receipt_file_with_gemini(
    file_bytes: bytes,
    mime_type: str,
) -> ExtractedReceiptDataSchema:
    """
    Use Gemini vision/document understanding to convert a receipt image or PDF
    into structured receipt fields for storage.
    """

    try:
        prompt = """
You are a receipt extraction system for a personal finance app.
Extract the receipt content from the attached file and return only valid JSON.

Rules:
- total_amount must be the final paid amount, not subtotal, tax, discount, or change.
- currency should be an ISO currency code if visible or strongly inferable.
- transaction_date must be ISO 8601 if present.
- merchant should be the clean business/vendor name.
- category should be a practical finance category if obvious, otherwise null.
- transactions should contain every distinct payment/transaction represented by the receipt.
- If the receipt represents one purchase, transactions should contain one item matching total_amount.
- If the receipt contains multiple separate payments, split bills, or separate purchases, transactions should contain one item for each transaction.
- raw_text should contain the useful receipt text you can read.
- confidence should be between 0 and 1.
"""
        with genai.Client(api_key=settings.GEMINI_API_KEY) as client:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=[
                    types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
                    prompt,
                ],
                config={
                    "response_mime_type": "application/json",
                    "response_schema": ExtractedReceiptDataSchema,
                },
            )

            return response.parsed

    except Exception as e:
        print(f"error in extract_receipt_file_with_gemini: {e}")
        raise

