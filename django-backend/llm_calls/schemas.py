from datetime import datetime
from decimal import Decimal
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class LLM_Call_1_Schema(BaseModel):
    groups: list[str] | None = None


class LLMFunctionArgumentSchema(BaseModel):
    name: str
    value: str


class LLMFunctionCallSchema(BaseModel):
    name: str
    arguments: list[LLMFunctionArgumentSchema] = Field(default_factory=list)


class LLM_Call_2_Schema(BaseModel):
    answer: str | None = None
    function_calls: list[LLMFunctionCallSchema] = Field(default_factory=list)


class ChatMessageSchema(BaseModel):
    role: str
    parts: list[dict[str, Any]]


class FunctionExecutionResultSchema(BaseModel):
    name: str
    arguments: dict[str, Any]
    result: Any


class CreateTransactionReqSchema(BaseModel):
    account_id: int | None = None
    receipt_id: int | None = None

    type: Literal["INCOME", "EXPENSE", "TRANSFER"] = "EXPENSE"
    amount: Decimal
    currency: str = "PKR"
    source: Literal["MANUAL", "CSV", "MOCK_BANK", "RECEIPT", "ASSISTANT"] = "MANUAL"
    external_id: str | None = None
    is_recurring: bool = False

    category: str | None = None
    merchant: str | None = None
    description: str | None = None

    transaction_date: datetime


class ExtractedTransactionSchema(BaseModel):
    amount: Decimal
    currency: str = "PKR"
    external_id: Optional[str] = None

    category: Optional[str] = None
    merchant: Optional[str] = None
    description: Optional[str] = None

    transaction_date: Optional[datetime] = None


class SkippedTransactionRowSchema(BaseModel):
    row_index: int
    reason: str
    raw_row: str


class ParseTransactionsSchema(BaseModel):
    parsed_rows: list[CreateTransactionReqSchema]
    skipped_rows: list[SkippedTransactionRowSchema] | None = None


class ReceiptItemSchema(BaseModel):
    name: str | None = None
    quantity: Decimal | None = None
    unit_price: Decimal | None = None
    total_price: Decimal | None = None


class ExtractedReceiptTransactionSchema(BaseModel):
    merchant: str | None = None
    amount: Decimal
    currency: str | None = None
    transaction_date: datetime | None = None
    category: str | None = None
    description: str | None = None


class ExtractedReceiptDataSchema(BaseModel):
    total_amount: Optional[Decimal] = None
    transactions: list[ExtractedTransactionSchema] = Field(default_factory=list)
    raw_text: Optional[str] = None
    confidence: Optional[Decimal] = None
