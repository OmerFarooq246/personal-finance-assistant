import { apiRequest } from "./client";
import { decimalToNumber } from "./normalizers";
import type { Budget } from "@/lib/types";

type BudgetResponse = Omit<Budget, "amount"> & {
  amount: number | string;
};

export async function listBudgets() {
  const budgets = await apiRequest<BudgetResponse[]>("/budgets/");
  return budgets.map((budget) => ({
    ...budget,
    amount: decimalToNumber(budget.amount),
  }));
}
