from datetime import date, datetime
from decimal import Decimal
from inspect import signature
from types import UnionType
from typing import Any, Union, get_args, get_origin

from pydantic import BaseModel

from llm_calls.schemas import FunctionExecutionResultSchema, LLMFunctionCallSchema
from .finance import (
    create_transaction_from_receipt,
    detect_recurring_transactions,
    detect_unusual_transactions,
    extract_receipt_details,
    get_accounts_summary,
    get_all_budget_statuses,
    get_biggest_transactions,
    get_budget_alerts,
    get_budget_status,
    get_cashflow_summary,
    get_category_spending_trend,
    get_cutback_suggestions_data,
    get_financial_summary_data,
    get_income_summary,
    get_merchant_spending_trend,
    get_monthly_spending_comparison,
    get_spending_by_category,
    get_spending_by_merchant,
    get_total_spending,
    get_transactions,
    get_user_context,
    lookup_merchant,
    lookup_merchant_from_transactions,
    save_user_context,
)


SERVICE_FUNCTIONS = {
    "get_transactions": get_transactions,
    "get_total_spending": get_total_spending,
    "get_spending_by_category": get_spending_by_category,
    "get_spending_by_merchant": get_spending_by_merchant,
    "get_biggest_transactions": get_biggest_transactions,
    "get_income_summary": get_income_summary,
    "get_cashflow_summary": get_cashflow_summary,
    "get_monthly_spending_comparison": get_monthly_spending_comparison,
    "get_category_spending_trend": get_category_spending_trend,
    "get_merchant_spending_trend": get_merchant_spending_trend,
    "get_financial_summary_data": get_financial_summary_data,
    "detect_recurring_transactions": detect_recurring_transactions,
    "detect_unusual_transactions": detect_unusual_transactions,
    "lookup_merchant_from_transactions": lookup_merchant_from_transactions,
    "get_cutback_suggestions_data": get_cutback_suggestions_data,
    "get_budget_status": get_budget_status,
    "get_all_budget_statuses": get_all_budget_statuses,
    "get_budget_alerts": get_budget_alerts,
    "get_accounts_summary": get_accounts_summary,
    "extract_receipt_details": extract_receipt_details,
    "create_transaction_from_receipt": create_transaction_from_receipt,
    "lookup_merchant": lookup_merchant,
    "get_user_context": get_user_context,
    "save_user_context": save_user_context,
}

BACKEND_SUPPLIED_ARGS = {"db", "current_user_id", "current_user", "user"}


def _json_safe(value: Any) -> Any:
    if isinstance(value, BaseModel):
        return value.model_dump(mode="json")
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    return value


def _unwrap_optional(annotation: Any) -> Any:
    origin = get_origin(annotation)
    if origin in (Union, UnionType):
        args = [arg for arg in get_args(annotation) if arg is not type(None)]
        if len(args) == 1:
            return args[0]
    return annotation


def _coerce_argument(value: Any, annotation: Any) -> Any:
    annotation = _unwrap_optional(annotation)

    if value is None:
        return None
    if annotation is str or annotation is Any:
        return str(value)
    if annotation is int:
        return int(value)
    if annotation is float:
        return float(value)
    if annotation is Decimal:
        return Decimal(str(value))
    if annotation is datetime:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    if isinstance(annotation, type) and annotation is bool:
        return str(value).lower() in {"1", "true", "yes"}

    return value


def _build_function_kwargs(function_call: LLMFunctionCallSchema) -> dict[str, Any]:
    function = SERVICE_FUNCTIONS.get(function_call.name)
    if not function:
        return {}

    function_signature = signature(function)
    kwargs = {}

    for argument in function_call.arguments:
        if argument.name in BACKEND_SUPPLIED_ARGS:
            continue
        if argument.name not in function_signature.parameters:
            print(f"Unknown argument '{argument.name}' for {function_call.name}")
            continue

        parameter = function_signature.parameters[argument.name]
        kwargs[argument.name] = _coerce_argument(argument.value, parameter.annotation)

    return kwargs


def execute_service_function_calls(
    current_user,
    function_calls: list[LLMFunctionCallSchema],
) -> list[FunctionExecutionResultSchema]:
    service_results = []

    for function_call in function_calls:
        name = function_call.name
        function = SERVICE_FUNCTIONS.get(name)
        if not function:
            print(f"[Error] - service function not found: {name}")
            continue

        try:
            kwargs = _build_function_kwargs(function_call)
            result = function(current_user=current_user, **kwargs)
            service_results.append(
                FunctionExecutionResultSchema(
                    name=name,
                    arguments=_json_safe(kwargs),
                    result=_json_safe(result),
                )
            )
        except Exception as e:
            print(f"error in execute_service_function_calls for function: {name}: {e}")
            service_results.append(
                FunctionExecutionResultSchema(
                    name=name,
                    arguments={argument.name: argument.value for argument in function_call.arguments},
                    result={"error": str(e)},
                )
            )

    return service_results
