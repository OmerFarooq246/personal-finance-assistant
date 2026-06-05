import json
from typing import Any

from django.conf import settings

from .schemas import FunctionExecutionResultSchema, LLM_Call_1_Schema, LLM_Call_2_Schema


def suggest_session_title(first_msg: str) -> str:
    try:
        from google import genai

        system_prompt = """
You are a context processing agent. Generate a short, concise, and highly descriptive title (3 to 5 words) for a chat session based on the user's message.
Rules:
- Do not use quotes, punctuation, or markdown formatting.
- Do not include conversational filler (e.g., do not say "Here is your title:").
- Return ONLY the raw text of the title.
"""
        with genai.Client(api_key=settings.GEMINI_API_KEY) as client:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=first_msg,
                config={"system_instruction": system_prompt},
            )
            return response.text.strip().replace('"', "")

    except Exception as e:
        print(f"error in suggest_session_title: {e}")
        raise


def llm_call_1(updated_chat_history: list[dict[str, Any]]) -> list[str] | None:
    try:
        from google import genai

        system_prompt = """
You are a part of a finance assistant that selects the most relevant service group(s) from the service map below by analysing user intent.
The selected service groups(s) will be used to get the relevant function documentations for another llm to extract the relevant data.
If the user request/message does not map to any service group, return {"groups": null}.

Service groups:

1. `transactions`
Use for transaction-level and spending/income questions:
- listing/filtering transactions
- total spending
- income summary
- cashflow summary
- spending by category
- spending by merchant
- biggest transactions
- month-to-month spending comparison
- category or merchant trends
- recurring/subscription-like transactions
- unusual transactions
- financial summary data
- cutback suggestion data

2. `budgets`
Use for budget questions:
- status of a specific budget by budget_id or category
- status of all budgets
- budget alerts when usage reaches a threshold

3. `accounts`
Use for account/balance questions:
- list user accounts
- total balances grouped by currency

4. `receipts`
Use for receipt workflow questions:
- extract receipt details from an uploaded file
- create expense transaction(s) from a processed receipt

5. `merchants`
Use for merchant lookup questions:
- look up merchant evidence using the user's own transaction history

6. `user_context`
Use for remembered user preferences/facts:
- fetch saved user context
- save a new user preference/fact for future chats
"""
        with genai.Client(api_key=settings.GEMINI_API_KEY) as client:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=updated_chat_history,
                config={
                    "system_instruction": system_prompt,
                    "response_mime_type": "application/json",
                    "response_schema": LLM_Call_1_Schema,
                },
            )
            return response.parsed.groups

    except Exception as e:
        print(f"error in llm_call_1: {e}")
        raise


def llm_call_2(
    updated_chat_history: list[dict[str, Any]],
    service_function_schemas: list[dict[str, Any]],
) -> LLM_Call_2_Schema:
    try:
        from google import genai

        system_prompt = f"""
You are a planning agent for a personal finance assistant.
Your job is to decide whether the assistant can answer directly or needs deterministic backend service calls.

Rules:
- Use ONLY the service functions documented below.
- Do not invent functions.
- Do not generate SQL.
- Do not include db, current_user_id, or current_user in function arguments; the backend supplies those.
- Function arguments must be a list of objects with `name` and `value`; encode every value as a string and omit unknown optional arguments.
- For date or datetime arguments, use ISO 8601 strings.
- If the question can be answered from the provided chat history/context, or it is a general question that does not require backend data, set `answer` to the final response and return an empty `function_calls` list.
- If backend data is needed, set `answer` to null and return `function_calls` in the order they should be executed.
- If a required argument is missing and cannot be inferred, `answer` with a concise clarification question and return an empty `function_calls` list.
- If the user asks anything unrelated to personal finance, budgeting, accounts, receipts, transactions, merchants, or saved finance preferences, politely refuse and redirect them to ask a personal finance question.

Relevant service function documentation:
{json.dumps(service_function_schemas, default=str)}
"""
        with genai.Client(api_key=settings.GEMINI_API_KEY) as client:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=updated_chat_history,
                config={
                    "system_instruction": system_prompt,
                    "response_mime_type": "application/json",
                    "response_schema": LLM_Call_2_Schema,
                },
            )
            return response.parsed

    except Exception as e:
        print(f"error in llm_call_2: {e}")
        raise


def llm_call_3(
    updated_chat_history: list[dict[str, Any]],
    service_results: list[FunctionExecutionResultSchema],
) -> str:
    try:
        from google import genai

        serialized_service_results = [
            service_result.model_dump(mode="json")
            for service_result in service_results
        ]

        system_prompt = f"""
You are the final response writer for a personal finance assistant.
Use the chat history and deterministic backend service results to answer the user's latest message.

Rules:
- Base financial answers only on the service results below.
- Do not invent transactions, balances, budgets, receipts, merchants, dates, amounts, or currencies.
- If a service result has an error, explain the relevant limitation briefly instead of pretending the data exists.
- If the service results are empty or insufficient, ask a concise follow-up question or say what data is missing.
- Keep the answer concise, helpful, and conversational.
- If useful, include exact amounts, currencies, categories, merchants, and dates from the service results.
- Do not mention internal function names unless it helps explain an error or missing data.
- If the user asks anything unrelated to personal finance, budgeting, accounts, receipts, transactions, merchants, or saved finance preferences, politely refuse and redirect them to ask a personal finance question.

Service results:
{json.dumps(serialized_service_results, default=str)}
"""
        with genai.Client(api_key=settings.GEMINI_API_KEY) as client:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=updated_chat_history,
                config={"system_instruction": system_prompt},
            )
            return response.text.strip()

    except Exception as e:
        print(f"error in llm_call_3: {e}")
        raise
