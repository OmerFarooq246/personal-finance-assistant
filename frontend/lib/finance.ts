import type { Budget, ReceiptStatus, Transaction, TransactionSource, TransactionType } from "./types";

export const palette = {
  primary: "#006948",
  primaryContainer: "#00855d",
  primaryFixedDim: "#68dba9",
  secondaryContainer: "#dce2f7",
  tertiary: "#9b3e3b",
  error: "#ba1a1a",
  surface: "#f8f9fa",
  surfaceContainer: "#edeeef",
  outlineVariant: "#bccac0",
  onSurface: "#191c1d",
  onSurfaceVariant: "#3d4a42",
};

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number, options: { sign?: boolean; compact?: boolean } = {}) {
  const abs = Math.abs(amount);
  const formatted = options.compact
    ? new Intl.NumberFormat("en-PK", {
        maximumFractionDigits: 1,
        notation: "compact",
      }).format(abs)
    : new Intl.NumberFormat("en-PK", {
        maximumFractionDigits: 0,
      }).format(abs);
  const prefix = options.sign && amount > 0 ? "+" : options.sign && amount < 0 ? "-" : "";
  return `${prefix}PKR ${formatted}`;
}

export function formatNumber(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value: string, month: "short" | "long" = "short") {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month,
    year: "numeric",
  }).format(new Date(value));
}

export function shortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function monthKey(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
  }).format(new Date(value));
}

export function signedAmount(transaction: Transaction) {
  if (transaction.type === "INCOME") return transaction.amount;
  if (transaction.type === "EXPENSE") return -transaction.amount;
  return transaction.amount;
}

export function summaryMetrics(source: Transaction[]) {
  const income = source
    .filter((transaction) => transaction.type === "INCOME")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const expenses = source
    .filter((transaction) => transaction.type === "EXPENSE")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const transfers = source
    .filter((transaction) => transaction.type === "TRANSFER")
    .reduce((total, transaction) => total + transaction.amount, 0);

  return {
    income,
    expenses,
    transfers,
    netCashflow: income - expenses,
    count: source.length,
  };
}

export function monthlyCashflowData(source: Transaction[]) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return months.map((month) => {
    const monthTransactions = source.filter((transaction) => monthKey(transaction.transaction_date) === month);
    const income = monthTransactions
      .filter((transaction) => transaction.type === "INCOME")
      .reduce((total, transaction) => total + transaction.amount, 0);
    const expenses = monthTransactions
      .filter((transaction) => transaction.type === "EXPENSE")
      .reduce((total, transaction) => total + transaction.amount, 0);

    return {
      month,
      Income: income,
      Expenses: expenses,
      Net: income - expenses,
    };
  });
}

export function categorySpendingData(source: Transaction[]) {
  const categoryTotals = source
    .filter((transaction) => transaction.type === "EXPENSE")
    .reduce<Record<string, number>>((totals, transaction) => {
      const category = transaction.category ?? "Uncategorized";
      totals[category] = (totals[category] ?? 0) + transaction.amount;
      return totals;
    }, {});

  return Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([id, value], index) => ({
      id,
      label: id,
      value,
      color: [palette.primary, palette.primaryContainer, palette.primaryFixedDim, palette.secondaryContainer, "#ffb3ae", "#9b3e3b"][index],
    }));
}

export function recentTransactions(source: Transaction[], limit = 8) {
  return [...source]
    .sort((a, b) => Date.parse(b.transaction_date) - Date.parse(a.transaction_date))
    .slice(0, limit);
}

export function budgetUsage(budget: Budget, source: Transaction[]) {
  const spent = source
    .filter((transaction) => transaction.type === "EXPENSE")
    .filter((transaction) => !budget.category || transaction.category === budget.category)
    .filter((transaction) => {
      const time = Date.parse(transaction.transaction_date);
      return time >= Date.parse(budget.start_date) && time <= Date.parse(budget.end_date);
    })
    .reduce((total, transaction) => total + transaction.amount, 0);

  return {
    spent,
    remaining: budget.amount - spent,
    percent: Math.min(100, Math.round((spent / budget.amount) * 100)),
  };
}

export function monthlyBudget(source: Budget[]) {
  return source.find((budget) => budget.category === null) ?? source[0] ?? null;
}

export function categoryIcon(category?: string | null) {
  const icons: Record<string, string> = {
    Dining: "restaurant",
    Groceries: "shopping_cart",
    Healthcare: "medical_services",
    "Internal Transfer": "account_balance",
    Rent: "home",
    Salary: "payments",
    Shopping: "shopping_bag",
    Transport: "directions_car",
    Utilities: "bolt",
    Entertainment: "movie",
  };
  return icons[category ?? ""] ?? "receipt_long";
}

export function sourceIcon(source: TransactionSource) {
  const icons: Record<TransactionSource, string> = {
    ASSISTANT: "smart_toy",
    CSV: "description",
    MANUAL: "edit_note",
    MOCK_BANK: "account_balance",
    RECEIPT: "receipt",
  };
  return icons[source];
}

export function typeBadgeClass(type: TransactionType) {
  if (type === "INCOME") return "bg-primary/10 text-primary";
  if (type === "EXPENSE") return "bg-error-container text-on-error-container";
  return "bg-surface-variant text-on-surface-variant";
}

export function statusBadgeClass(status: ReceiptStatus) {
  if (status === "PROCESSED") return "bg-primary-container text-on-primary-container";
  if (status === "PROCESSING") return "bg-surface-container-high text-on-surface";
  if (status === "FAILED") return "bg-error-container text-on-error-container";
  return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
}

export function statusIcon(status: ReceiptStatus) {
  if (status === "PROCESSED") return "check_circle";
  if (status === "PROCESSING") return "sync";
  if (status === "FAILED") return "error";
  return "rule";
}
