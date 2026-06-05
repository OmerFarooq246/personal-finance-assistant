"use client";

import { useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { PageHeader } from "@/components/ui/PageHeader";
import { listBudgets } from "@/lib/api/budgets";
import { listTransactions } from "@/lib/api/transactions";
import { budgetUsage, categoryIcon, formatCurrency, formatDate } from "@/lib/finance";
import { useAsyncData } from "@/lib/hooks/useAsyncData";
import type { Budget, Transaction } from "@/lib/types";

type BudgetPageData = {
  budgets: Budget[];
  transactions: Transaction[];
};

export function BudgetsPage() {
  const loadBudgets = useCallback(async () => {
    const [budgets, transactions] = await Promise.all([listBudgets(), listTransactions({ limit: 500 })]);
    return { budgets, transactions };
  }, []);
  const { data, error, loading } = useAsyncData<BudgetPageData>(loadBudgets);
  const budgets = data?.budgets ?? [];
  const transactions = data?.transactions ?? [];

  return (
    <>
      <PageHeader title="Budgets" description="View existing budget limits and current usage." />

      {loading ? <div className="mb-4 rounded-lg border border-outline-variant bg-surface-container-low p-3 text-on-surface-variant">Loading budgets...</div> : null}
      {error ? <div className="mb-4 rounded-lg border border-error/30 bg-error-container p-3 text-error">{error}</div> : null}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {budgets.map((budget) => {
          const usage = budgetUsage(budget, transactions);
          return (
            <Card className="p-4" key={budget.id}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-surface-container text-on-surface-variant">
                    <MaterialIcon name={categoryIcon(budget.category ?? "Internal Transfer")} />
                  </div>
                  <div>
                    <h2 className="headline-md">{budget.category ?? "Overall Budget"}</h2>
                    <p className="label-md text-on-surface-variant">{budget.period}</p>
                  </div>
                </div>
                <span className="rounded-full bg-secondary-container px-2.5 py-1 label-md text-primary">{budget.currency}</span>
              </div>

              <div className="mb-3 flex items-end justify-between">
                <div>
                  <span className="label-md uppercase text-on-surface-variant">Spent</span>
                  <p className="numeral-md text-on-surface">{formatCurrency(usage.spent)}</p>
                </div>
                <div className="text-right">
                  <span className="label-md uppercase text-on-surface-variant">Limit</span>
                  <p className="numeral-md text-on-surface-variant">{formatCurrency(budget.amount)}</p>
                </div>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                <div className={usage.percent > 85 ? "h-full rounded-full bg-error" : "h-full rounded-full bg-primary"} style={{ width: `${usage.percent}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between label-md text-on-surface-variant">
                <span>{formatDate(budget.start_date)} - {formatDate(budget.end_date)}</span>
                <span>{usage.percent}% used</span>
              </div>
            </Card>
          );
        })}
        {!loading && !error && budgets.length === 0 ? (
          <Card className="p-6 text-center text-on-surface-variant">No budgets found.</Card>
        ) : null}
      </section>
    </>
  );
}
