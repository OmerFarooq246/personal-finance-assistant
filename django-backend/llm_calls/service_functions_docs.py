SERVICE_FUNCTION_SCHEMAS = {
    "transactions": [
        {
            "name": "get_transactions",
            "description": "Fetch filtered transaction rows for detailed answers, drill-downs, or showing recent transactions.",
            "when_to_use": [
                "User asks to show/list transactions.",
                "User asks for recent transactions for a category, merchant, account, date range, type, or currency.",
                "You need raw transaction rows instead of only aggregates."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "format": "date-time", "nullable": True, "description": "Include transactions on/after this datetime."},
                    "end_date": {"type": "string", "format": "date-time", "nullable": True, "description": "Include transactions on/before this datetime."},
                    "transaction_type": {"type": "string", "nullable": True, "enum": ["EXPENSE", "INCOME"], "description": "Filter by transaction type."},
                    "category": {"type": "string", "nullable": True, "description": "Case-insensitive partial category filter."},
                    "merchant": {"type": "string", "nullable": True, "description": "Case-insensitive partial merchant filter."},
                    "account_id": {"type": "integer", "nullable": True, "description": "Filter by account id."},
                    "currency": {"type": "string", "nullable": True, "description": "Filter by currency, e.g. PKR."},
                    "limit": {"type": "integer", "default": 25, "description": "Maximum rows to return."},
                    "offset": {"type": "integer", "default": 0, "description": "Pagination offset."}
                },
                "required": []
            },
            "returns": "TransactionsResultSchema"
        },
        {
            "name": "get_total_spending",
            "description": "Calculate total expense amount for a date/category/merchant/account/currency slice.",
            "when_to_use": [
                "User asks how much they spent.",
                "User asks total expense for a category, merchant, account, currency, or period."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "format": "date-time", "nullable": True},
                    "end_date": {"type": "string", "format": "date-time", "nullable": True},
                    "category": {"type": "string", "nullable": True},
                    "merchant": {"type": "string", "nullable": True},
                    "account_id": {"type": "integer", "nullable": True},
                    "currency": {"type": "string", "nullable": True}
                },
                "required": []
            },
            "returns": "TotalSpendingResultSchema"
        },
        {
            "name": "get_spending_by_category",
            "description": "Aggregate expense totals grouped by category.",
            "when_to_use": [
                "User asks where their money went.",
                "User asks top categories or category breakdown.",
                "User asks for chart/summary by category."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "format": "date-time", "nullable": True},
                    "end_date": {"type": "string", "format": "date-time", "nullable": True},
                    "currency": {"type": "string", "nullable": True},
                    "limit": {"type": "integer", "default": 10}
                },
                "required": []
            },
            "returns": "CategorySpendingResultSchema"
        },
        {
            "name": "get_spending_by_merchant",
            "description": "Aggregate expense totals grouped by merchant, optionally filtered by category/merchant/date/currency.",
            "when_to_use": [
                "User asks top merchants.",
                "User asks spending by shop/vendor/company.",
                "User asks merchant totals in a category or period."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "format": "date-time", "nullable": True},
                    "end_date": {"type": "string", "format": "date-time", "nullable": True},
                    "category": {"type": "string", "nullable": True},
                    "merchant": {"type": "string", "nullable": True},
                    "currency": {"type": "string", "nullable": True},
                    "limit": {"type": "integer", "default": 10}
                },
                "required": []
            },
            "returns": "MerchantSpendingResultSchema"
        },
        {
            "name": "get_biggest_transactions",
            "description": "Return the largest expense transactions matching filters.",
            "when_to_use": [
                "User asks biggest/largest/highest transactions.",
                "User asks what expensive purchases happened in a period/category/merchant."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "format": "date-time", "nullable": True},
                    "end_date": {"type": "string", "format": "date-time", "nullable": True},
                    "category": {"type": "string", "nullable": True},
                    "merchant": {"type": "string", "nullable": True},
                    "currency": {"type": "string", "nullable": True},
                    "limit": {"type": "integer", "default": 10}
                },
                "required": []
            },
            "returns": "TransactionsResultSchema"
        },
        {
            "name": "get_income_summary",
            "description": "Calculate total income for a period/currency.",
            "when_to_use": ["User asks how much they earned/received as income."],
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "format": "date-time", "nullable": True},
                    "end_date": {"type": "string", "format": "date-time", "nullable": True},
                    "currency": {"type": "string", "nullable": True}
                },
                "required": []
            },
            "returns": "IncomeSummaryResultSchema"
        },
        {
            "name": "get_cashflow_summary",
            "description": "Calculate income, spending, and net cashflow for a period/currency.",
            "when_to_use": [
                "User asks cashflow, net savings, money in vs money out.",
                "User asks whether they saved or overspent in a period."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "format": "date-time", "nullable": True},
                    "end_date": {"type": "string", "format": "date-time", "nullable": True},
                    "currency": {"type": "string", "nullable": True}
                },
                "required": []
            },
            "returns": "CashflowSummaryResultSchema"
        },
        {
            "name": "get_monthly_spending_comparison",
            "description": "Compare spending between two explicit periods and return difference and percent change.",
            "when_to_use": [
                "User asks compare this month vs last month.",
                "User asks if spending increased/decreased between two periods."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "current_start_date": {"type": "string", "format": "date-time"},
                    "current_end_date": {"type": "string", "format": "date-time"},
                    "comparison_start_date": {"type": "string", "format": "date-time"},
                    "comparison_end_date": {"type": "string", "format": "date-time"},
                    "category": {"type": "string", "nullable": True},
                    "currency": {"type": "string", "nullable": True}
                },
                "required": ["current_start_date", "current_end_date", "comparison_start_date", "comparison_end_date"]
            },
            "returns": "MonthlySpendingComparisonResultSchema"
        },
        {
            "name": "get_category_spending_trend",
            "description": "Return monthly expense totals grouped by category.",
            "when_to_use": [
                "User asks trend over time by category.",
                "User asks how category spending changed month by month."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "nullable": True},
                    "start_date": {"type": "string", "format": "date-time", "nullable": True},
                    "end_date": {"type": "string", "format": "date-time", "nullable": True},
                    "currency": {"type": "string", "nullable": True}
                },
                "required": []
            },
            "returns": "CategoryTrendResultSchema"
        },
        {
            "name": "get_merchant_spending_trend",
            "description": "Return monthly expense totals grouped by merchant.",
            "when_to_use": [
                "User asks trend over time by merchant.",
                "User asks how spending at a merchant changed month by month."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "merchant": {"type": "string", "nullable": True},
                    "start_date": {"type": "string", "format": "date-time", "nullable": True},
                    "end_date": {"type": "string", "format": "date-time", "nullable": True},
                    "currency": {"type": "string", "nullable": True}
                },
                "required": []
            },
            "returns": "MerchantTrendResultSchema"
        },
        {
            "name": "get_financial_summary_data",
            "description": "Collect cashflow, top categories, and top merchants for a plain-English financial summary.",
            "when_to_use": [
                "User asks for overall financial summary.",
                "User asks summarize my spending/income for a period."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "format": "date-time", "nullable": True},
                    "end_date": {"type": "string", "format": "date-time", "nullable": True},
                    "currency": {"type": "string", "nullable": True}
                },
                "required": []
            },
            "returns": "FinancialSummaryDataResultSchema"
        },
        {
            "name": "detect_recurring_transactions",
            "description": "Find repeated same-merchant, same-amount expenses that may be subscriptions or recurring charges.",
            "when_to_use": [
                "User asks about subscriptions.",
                "User asks recurring payments/charges."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "format": "date-time", "nullable": True},
                    "end_date": {"type": "string", "format": "date-time", "nullable": True},
                    "min_occurrences": {"type": "integer", "default": 3},
                    "currency": {"type": "string", "nullable": True}
                },
                "required": []
            },
            "returns": "RecurringTransactionsResultSchema"
        },
        {
            "name": "detect_unusual_transactions",
            "description": "Flag expenses that are unusually high compared with their category history.",
            "when_to_use": [
                "User asks for unusual/suspicious/outlier transactions.",
                "User asks what expenses look abnormal."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "format": "date-time", "nullable": True},
                    "end_date": {"type": "string", "format": "date-time", "nullable": True},
                    "threshold_stddevs": {"type": "number", "default": 2.0},
                    "limit": {"type": "integer", "default": 10}
                },
                "required": []
            },
            "returns": "UnusualTransactionsResultSchema"
        },
        {
            "name": "lookup_merchant_from_transactions",
            "description": "Look up a merchant using the user's own matching transactions and merchant spending summary.",
            "when_to_use": [
                "User asks about a specific merchant and you need evidence from their transactions.",
                "Internal use when merchant service delegates to transaction data."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "merchant": {"type": "string", "description": "Merchant name or partial merchant text."},
                    "limit": {"type": "integer", "default": 10}
                },
                "required": ["merchant"]
            },
            "returns": "MerchantTransactionsLookupResultSchema"
        },
        {
            "name": "get_cutback_suggestions_data",
            "description": "Gather top categories, top merchants, and recurring charges for cutback suggestions.",
            "when_to_use": [
                "User asks where they can cut back/save money.",
                "User asks for spending reduction suggestions based on data."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "format": "date-time", "nullable": True},
                    "end_date": {"type": "string", "format": "date-time", "nullable": True},
                    "currency": {"type": "string", "nullable": True}
                },
                "required": []
            },
            "returns": "CutbackSuggestionsDataResultSchema"
        }
    ],

    "budgets": [
        {
            "name": "get_budget_status",
            "description": "Find one budget and compare its limit against spending in its active period.",
            "when_to_use": [
                "User asks status of a specific budget.",
                "User asks remaining amount or percent used for a category budget."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "budget_id": {"type": "integer", "nullable": True, "description": "Specific budget id."},
                    "category": {"type": "string", "nullable": True, "description": "Budget category if budget_id is not known."}
                },
                "required": []
            },
            "notes": "Provide either budget_id or category. If neither is known, call get_all_budget_statuses first.",
            "returns": "BudgetStatusResultSchema"
        },
        {
            "name": "get_all_budget_statuses",
            "description": "Return status calculations for every budget owned by the user.",
            "when_to_use": [
                "User asks for all budgets.",
                "User asks which budgets exist or wants a budget overview."
            ],
            "parameters": {"type": "object", "properties": {}, "required": []},
            "returns": "List[BudgetStatusResultSchema]"
        },
        {
            "name": "get_budget_alerts",
            "description": "Return budgets whose usage has reached the warning threshold.",
            "when_to_use": [
                "User asks if any budgets are close to limit.",
                "User asks budget alerts/warnings/over-budget categories."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "threshold_percent": {"type": "number", "default": 80, "description": "Budget usage percentage threshold, e.g. 80 or 90."}
                },
                "required": []
            },
            "returns": "BudgetAlertsResultSchema"
        }
    ],

    "accounts": [
        {
            "name": "get_accounts_summary",
            "description": "Fetch user accounts and aggregate balances by currency.",
            "when_to_use": [
                "User asks account balances.",
                "User asks total balance across accounts or balances by currency."
            ],
            "parameters": {"type": "object", "properties": {}, "required": []},
            "returns": "AccountsSummaryResultSchema"
        }
    ],

    "receipts": [
        {
            "name": "extract_receipt_details",
            "description": "Create a receipt row, extract structured fields from a receipt file with Gemini, and store the result.",
            "when_to_use": [
                "User uploads a receipt and wants it parsed/extracted.",
                "User wants receipt details extracted from image/PDF/file."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "Server-side path to uploaded receipt file."},
                    "mime_type": {"type": "string", "description": "MIME type of uploaded file, e.g. image/jpeg or application/pdf."}
                },
                "required": ["file_path", "mime_type"]
            },
            "returns": "ReceiptResponseSchema"
        },
        {
            "name": "create_transaction_from_receipt",
            "description": "Create one or more expense transactions from a processed receipt owned by the user.",
            "when_to_use": [
                "User confirms they want to create transaction(s) from an extracted receipt.",
                "A processed receipt already exists and needs to be converted into transaction records."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "receipt_id": {"type": "integer", "description": "ID of the processed receipt."}
                },
                "required": ["receipt_id"]
            },
            "returns": "CreateTransactionFromReceiptResultSchema"
        }
    ],

    "merchants": [
        {
            "name": "lookup_merchant",
            "description": "Look up merchant evidence using only the user's own transactions.",
            "when_to_use": [
                "User asks about a merchant/vendor and wants matching evidence from their own history.",
                "User asks whether/when/how much they spent at a named merchant."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "merchant": {"type": "string", "description": "Merchant name or partial merchant text."},
                    "limit": {"type": "integer", "default": 10}
                },
                "required": ["merchant"]
            },
            "returns": "MerchantTransactionsLookupResultSchema"
        }
    ],

    "user_context": [
        {
            "name": "get_user_context",
            "description": "Fetch remembered facts/preferences for the current user.",
            "when_to_use": [
                "User asks based on saved preferences.",
                "You need personalization before answering."
            ],
            "parameters": {"type": "object", "properties": {}, "required": []},
            "returns": "UserContextResultSchema"
        },
        {
            "name": "save_user_context",
            "description": "Persist a new memory item the assistant should use in future chats.",
            "when_to_use": [
                "User explicitly asks to remember/save a preference or fact.",
                "User says future answers should follow a persistent preference."
            ],
            "parameters": {
                "type": "object",
                "properties": {
                    "context": {"type": "string", "description": "The user preference/fact to save."}
                },
                "required": ["context"]
            },
            "returns": "SavedUserContextResultSchema"
        }
    ]
}