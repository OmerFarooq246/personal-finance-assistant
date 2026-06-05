"use client";

import Link from "next/link";
import { useCallback } from "react";
import { CategoryDonutChart, MonthlyCashflowChart } from "@/components/charts/FinanceCharts";
import { Card } from "@/components/ui/Card";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { PageHeader } from "@/components/ui/PageHeader";
import { listBudgets } from "@/lib/api/budgets";
import { listReceipts } from "@/lib/api/receipts";
import { listTransactions } from "@/lib/api/transactions";
import { budgetUsage, categoryIcon, formatCurrency, monthlyBudget, recentTransactions, shortDate, signedAmount, summaryMetrics } from "@/lib/finance";
import { useAsyncData } from "@/lib/hooks/useAsyncData";
import type { Budget, Receipt, Transaction } from "@/lib/types";

type DashboardData = {
  budgets: Budget[];
  receipts: Receipt[];
  transactions: Transaction[];
};

export function DashboardPage() {
  const loadDashboard = useCallback(async () => {
    const [transactions, budgets, receipts] = await Promise.all([
      listTransactions({ limit: 500 }),
      listBudgets(),
      listReceipts(),
    ]);
    return { budgets, receipts, transactions };
  }, []);
  const { data, error, loading } = useAsyncData<DashboardData>(loadDashboard);
  const transactions = data?.transactions ?? [];
  const budgets = data?.budgets ?? [];
  const receipts = data?.receipts ?? [];
  const metrics = summaryMetrics(transactions);
  const budget = monthlyBudget(budgets);
  const usage = budget ? budgetUsage(budget, transactions) : null;
  const recentReceipts = receipts.slice(0, 3);

  return (
    <>
      <PageHeader title="Dashboard" description="Here is your financial summary for June." />

      {loading ? <StatusPanel message="Loading your finance summary..." /> : null}
      {error ? <StatusPanel tone="error" message={error} /> : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon="arrow_downward" label="Total Income" tone="income" value={formatCurrency(metrics.income)} />
        <MetricCard icon="arrow_upward" label="Total Expenses" tone="expense" value={formatCurrency(metrics.expenses)} />
        <MetricCard icon="account_balance" label="Net Cashflow" tone="primary" value={formatCurrency(metrics.netCashflow, { sign: true })} />
        <MetricCard icon="sync_alt" label="Transactions" value={String(metrics.count)} />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col p-4 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="headline-md">Monthly Cashflow</h2>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <div className="flex items-center gap-3 label-md text-[11px] text-on-surface-variant">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Income
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#ffb3ae]" />
                  Expenses
                </span>
              </div>
              <span className="rounded-full bg-surface-container px-3 py-1 label-md text-on-surface-variant">Last 6 Months</span>
            </div>
          </div>
          <MonthlyCashflowChart transactions={transactions} />
        </Card>

        <Card className="flex flex-col p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="headline-md">Categories</h2>
          </div>
          <CategoryDonutChart transactions={transactions} />
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="headline-md">Recent Transactions</h2>
            <Link className="label-md text-primary hover:underline" href="/transactions">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-12 gap-2 border-b border-surface-variant pb-2 label-md uppercase text-on-surface-variant">
            <div className="col-span-6 sm:col-span-5">Merchant</div>
            <div className="col-span-3 hidden sm:block">Date</div>
            <div className="col-span-6 text-right sm:col-span-4">Amount</div>
          </div>
          <div>
            {recentTransactions(transactions, 5).map((transaction) => (
              <div className="grid grid-cols-12 items-center gap-2 border-b border-surface-container-high py-3 last:border-0" key={transaction.id}>
                <div className="col-span-6 flex min-w-0 items-center gap-3 sm:col-span-5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
                    <MaterialIcon name={categoryIcon(transaction.category)} className="text-[16px]" />
                  </div>
                  <span className="truncate text-on-surface">{transaction.merchant}</span>
                </div>
                <div className="col-span-3 hidden text-sm text-on-surface-variant sm:block">{shortDate(transaction.transaction_date)}</div>
                <div className={transaction.type === "INCOME" ? "col-span-6 text-right numeral-md text-primary sm:col-span-4" : "col-span-6 text-right numeral-md text-on-surface sm:col-span-4"}>
                  {formatCurrency(signedAmount(transaction), { sign: true })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="p-4">
            {budget && usage ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="headline-md">Monthly Budget</h2>
                  <span className="label-md text-on-surface-variant">{shortDate(budget.start_date)} - {shortDate(budget.end_date)}</span>
                </div>
                <div className="mb-2 flex items-end justify-between">
                  <div>
                    <span className="label-md text-on-surface-variant">Spent</span>
                    <p className="numeral-md text-on-surface">{formatCurrency(usage.spent)}</p>
                  </div>
                  <div className="text-right">
                    <span className="label-md text-on-surface-variant">Budget</span>
                    <p className="numeral-md text-on-surface-variant">{formatCurrency(budget.amount)}</p>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${usage.percent}%` }} />
                </div>
                <div className="mt-2 text-right">
                  <span className="label-md text-[11px] text-on-surface-variant">{usage.percent}% utilized</span>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-outline-variant p-4 text-center text-on-surface-variant">
                No budget records available.
              </div>
            )}
          </Card>

          <Card className="flex-1 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="headline-md">Recent Receipts</h2>
              <Link href="/receipts" aria-label="View receipts">
                <MaterialIcon name="add_circle" className="text-[20px] text-on-surface-variant" />
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {recentReceipts.map((receipt) => (
                <Link
                  className="flex items-center justify-between rounded-lg border border-surface-variant p-3 transition-colors hover:bg-surface-container-low"
                  href="/receipts"
                  key={receipt.id}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-surface-container text-on-surface-variant">
                      <MaterialIcon name="receipt_long" />
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate font-medium text-on-surface">{receipt.file_name}</span>
                      <span className="label-md text-[11px] text-on-surface-variant">
                        {shortDate(receipt.created_at)} • {receipt.total_amount ? formatCurrency(receipt.total_amount) : "Review"}
                      </span>
                    </div>
                  </div>
                  <span className="rounded border border-[#A7F3D0] bg-[#ECFDF5] px-2 py-1 label-md text-[10px] uppercase text-[#059669]">
                    {receipt.processing_status.replace("_", " ")}
                  </span>
                </Link>
              ))}
              {!recentReceipts.length ? <p className="text-sm text-on-surface-variant">No receipts uploaded yet.</p> : null}
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}

function StatusPanel({ message, tone = "default" }: { message: string; tone?: "default" | "error" }) {
  return (
    <div className={tone === "error" ? "mb-6 rounded-lg border border-error/30 bg-error-container p-3 text-error" : "mb-6 rounded-lg border border-outline-variant bg-surface-container-low p-3 text-on-surface-variant"}>
      {message}
    </div>
  );
}

function MetricCard({ icon, label, value, tone = "default" }: { icon: string; label: string; value: string; tone?: "default" | "primary" | "income" | "expense" }) {
  const iconClass =
    tone === "expense"
      ? "bg-error-container/50 text-error"
      : tone === "income"
        ? "bg-primary-container/20 text-primary"
        : "bg-surface-variant text-on-surface";
  const valueClass = tone === "primary" || tone === "income" ? "text-primary" : "text-on-surface";

  return (
    <Card className="flex h-[102px] flex-col justify-between p-4">
      <div className="flex items-start justify-between">
        <span className="label-md uppercase text-on-surface-variant">{label}</span>
        <div className={`flex h-7 w-7 items-center justify-center rounded-full ${iconClass}`}>
          <MaterialIcon name={icon} className="text-[15px]" />
        </div>
      </div>
      <div className={`numeral-lg ${valueClass}`}>{value}</div>
    </Card>
  );
}
