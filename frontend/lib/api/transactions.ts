import { apiRequest } from "./client";
import { decimalToNumber } from "./normalizers";
import type { Transaction, TransactionType } from "@/lib/types";

type TransactionResponse = Omit<Transaction, "amount"> & {
  amount: number | string;
};

export type TransactionFilters = {
  start_date?: string;
  end_date?: string;
  type?: TransactionType;
  category?: string;
  merchant?: string;
  account_id?: number;
  currency?: string;
  limit?: number;
  offset?: number;
};

export async function listTransactions(filters: TransactionFilters = {}) {
  const transactions = await apiRequest<TransactionResponse[]>(`/transactions/${queryString(filters)}`);
  return transactions.map(normalizeTransaction);
}

export async function importTransactionsCsv(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const transactions = await apiRequest<TransactionResponse[]>("/transactions/import-csv", {
    method: "POST",
    body: formData,
  });
  return transactions.map(normalizeTransaction);
}

function normalizeTransaction(transaction: TransactionResponse): Transaction {
  return {
    ...transaction,
    amount: decimalToNumber(transaction.amount),
  };
}

function queryString(filters: TransactionFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}
