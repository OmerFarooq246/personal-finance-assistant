export type User = {
  id: number;
  email: string;
  full_name?: string | null;
  role: string;
  created_at: string;
};

export type Account = {
  id: number;
  user_id?: number;
  name: string;
  type: string;
  currency: string;
  balance: number;
  created_at: string;
  updated_at: string;
};

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type TransactionSource = "MANUAL" | "CSV" | "MOCK_BANK" | "RECEIPT" | "ASSISTANT";

export type Transaction = {
  id: number;
  user_id?: number;
  account_id?: number | null;
  receipt_id?: number | null;
  type: TransactionType;
  amount: number;
  currency: string;
  source: TransactionSource;
  external_id?: string | null;
  is_recurring: boolean;
  category?: string | null;
  merchant?: string | null;
  description?: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
};

export type ReceiptStatus = "PROCESSING" | "PROCESSED" | "FAILED" | "NEEDS_REVIEW";

export type Receipt = {
  id: number;
  user_id?: number;
  file_name: string;
  total_amount?: number | null;
  raw_text?: string | null;
  extracted_data?: Record<string, unknown> | null;
  processing_status: ReceiptStatus;
  created_at: string;
  updated_at: string;
};

export type BudgetPeriod = "WEEKLY" | "MONTHLY" | "YEARLY";

export type Budget = {
  id: number;
  user_id?: number;
  category?: string | null;
  amount: number;
  currency: string;
  period: BudgetPeriod;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
};

export type UserContext = {
  id: number;
  user_id?: number;
  context: string;
  created_at: string;
  updated_at: string;
};

export type ChatSession = {
  id: number;
  title: string;
  user_id?: number;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: number;
  session_id: number;
  role: "USER" | "ASSISTANT";
  content: string;
  metadata_json?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};
