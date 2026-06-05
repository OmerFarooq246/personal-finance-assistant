from pprint import pprint
from typing import Any

from django.conf import settings

from .schemas import CreateTransactionReqSchema, ParseTransactionsSchema


def parse_csv_rows_to_transactions(
    rows: list[dict[str, Any]],
) -> list[CreateTransactionReqSchema]:
    """
    Uses an LLM to normalize messy CSV rows into CreateTransactionReqSchema objects.
    Best for unknown/messy CSV formats, not clean known CSVs.
    """

    try:
        from google import genai

        system_prompt = f"""
You are a financial transaction CSV parser.
Convert raw CSV rows into normalized transaction objects.

Rules:
- Return only valid JSON matching the provided schema.
- transaction_date must be ISO 8601.
- merchant should be the clean merchant/vendor name if available.
- description should preserve useful narration/details.
- category can be inferred if obvious, otherwise null.
- external_id should be stable if possible. Use transaction id/reference if present.
- If a row cannot be parsed, put it in skipped_rows with a reason.

Rows:
{rows}
"""
        with genai.Client(api_key=settings.GEMINI_API_KEY) as client:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=system_prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": ParseTransactionsSchema,
                },
            )

            parsed_rows = response.parsed.parsed_rows
            skipped_rows = response.parsed.skipped_rows
            if skipped_rows:
                print(f"skipped_rows - {len(skipped_rows)}:")
                pprint(skipped_rows)

            return parsed_rows

    except Exception as e:
        print(f"error in parse_csv_rows_to_transactions: {e}")
        raise

