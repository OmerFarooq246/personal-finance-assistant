"use client";

import { useCallback, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { PageHeader } from "@/components/ui/PageHeader";
import { importTransactionsCsv, listTransactions } from "@/lib/api/transactions";
import {
  categoryIcon,
  cn,
  formatCurrency,
  formatDate,
  formatNumber,
  signedAmount,
  sourceIcon,
  typeBadgeClass,
} from "@/lib/finance";
import { useAsyncData } from "@/lib/hooks/useAsyncData";

export function TransactionsPage() {
  const pageSize = 12;
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const loadTransactions = useCallback(
    () =>
      listTransactions({
        limit: 500,
        category: category || undefined,
        start_date: startDate ? `${startDate}T00:00:00Z` : undefined,
        end_date: endDate ? `${endDate}T23:59:59Z` : undefined,
      }),
    [category, endDate, startDate],
  );
  const { data: transactions, error, loading, reload } = useAsyncData(loadTransactions);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const sorted = [...(transactions ?? [])].sort((a, b) => Date.parse(b.transaction_date) - Date.parse(a.transaction_date));
    if (!needle) return sorted;
    return sorted.filter((transaction) =>
      [transaction.merchant, transaction.category, transaction.description, transaction.type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query, transactions]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(pageStart, pageStart + pageSize);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function updateCategory(value: string) {
    setCategory(value);
    setPage(1);
  }

  function updateStartDate(value: string) {
    setStartDate(value);
    setPage(1);
  }

  function updateEndDate(value: string) {
    setEndDate(value);
    setPage(1);
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setProcessing(true);
    setUploadMessage(null);
    try {
      const imported = await importTransactionsCsv(file);
      setUploadMessage(`Imported ${imported.length} transaction${imported.length === 1 ? "" : "s"}.`);
      await reload();
    } catch (caught) {
      setUploadMessage(caught instanceof Error ? caught.message : "CSV upload failed.");
    } finally {
      setProcessing(false);
      event.target.value = "";
    }
  }

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Manage and categorize your financial activity."
        action={
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-on-primary shadow-sm transition-colors hover:bg-primary-container">
            <MaterialIcon name="upload_file" className="text-[17px]" />
            <span className="label-md">Upload CSV</span>
            <input className="sr-only" type="file" accept=".csv,text/csv" onChange={onFileChange} />
          </label>
        }
      />

      <section className="relative mb-6 flex min-h-[170px] flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-primary-fixed-dim bg-surface-container-lowest p-6 text-center transition-all">
        {processing ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-container-lowest/85 backdrop-blur-sm">
            <div className="w-64 max-w-full">
              <div className="mb-2 flex justify-between gap-3">
                <span className="label-md text-on-surface">Processing {fileName ?? "statement.csv"}...</span>
                <span className="label-md font-bold text-primary">64%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                <div className="h-full rounded-full bg-primary" style={{ animation: "upload-progress 1.4s ease-in-out infinite" }} />
              </div>
            </div>
          </div>
        ) : null}

        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-primary">
          <MaterialIcon name="cloud_upload" className="text-xl" />
        </div>
        <h2 className="headline-md mb-1">Drag and drop your bank statement</h2>
        <p className="max-w-md text-on-surface-variant">Supported format: CSV bank statements.</p>
        {uploadMessage ? <p className="mt-2 label-md text-primary">{uploadMessage}</p> : null}
        <label className="mt-4 cursor-pointer label-md text-primary hover:underline">
          Browse files
          <input className="sr-only" type="file" accept=".csv,text/csv" onChange={onFileChange} />
        </label>
      </section>

      <section className="mb-5 flex flex-col items-center justify-between gap-3 lg:flex-row">
        <div className="relative w-full lg:w-96">
          <MaterialIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-9 pr-3 text-on-surface outline-none transition-shadow focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Search merchant, category..."
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
          />
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
          <select
            className="min-w-[140px] flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            value={category}
            onChange={(event) => updateCategory(event.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Groceries">Groceries</option>
            <option value="Transport">Transport</option>
            <option value="Utilities">Utilities</option>
            <option value="Salary">Income</option>
          </select>
          <div className="flex min-w-[320px] flex-1 items-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
            <input className="min-w-0 flex-1 border-none bg-transparent px-3 py-2 text-sm text-on-surface outline-none" type="date" value={startDate} onChange={(event) => updateStartDate(event.target.value)} />
            <span className="px-2 text-on-surface-variant">-</span>
            <input className="min-w-0 flex-1 border-none bg-transparent px-3 py-2 text-sm text-on-surface outline-none" type="date" value={endDate} onChange={(event) => updateEndDate(event.target.value)} />
          </div>
          <button className="rounded-lg border border-outline-variant bg-surface-container p-2.5 text-on-surface transition-colors hover:bg-surface-container-high" aria-label="Export transactions">
            <MaterialIcon name="download" />
          </button>
        </div>
      </section>

      <Card className="overflow-x-auto shadow-sm">
        {loading ? <div className="p-5 text-on-surface-variant">Loading transactions...</div> : null}
        {error ? <div className="p-5 text-error">{error}</div> : null}
        <table className="w-full border-collapse whitespace-nowrap text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-bright label-md uppercase text-on-surface-variant">
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3 font-semibold">Merchant / Description</th>
              <th className="px-5 py-3 font-semibold">Category</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 text-right font-semibold">Amount (PKR)</th>
              <th className="px-5 py-3 text-center font-semibold">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container text-on-surface">
            {pageRows.map((transaction) => (
              <tr className="group cursor-pointer transition-colors hover:bg-surface-container-low" key={transaction.id}>
                <td className="px-5 py-3 text-on-surface-variant">{formatDate(transaction.transaction_date)}</td>
                <td className="px-5 py-3">
                  <p className="font-medium">{transaction.merchant}</p>
                  <p className="text-xs text-on-surface-variant">{transaction.description}</p>
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary-container px-2 py-1 text-[11px] font-medium text-on-secondary-fixed">
                    <MaterialIcon name={categoryIcon(transaction.category)} className="text-[14px]" />
                    {transaction.category}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide", typeBadgeClass(transaction.type))}>
                    {titleCase(transaction.type)}
                  </span>
                </td>
                <td className={cn("px-5 py-3 text-right numeral-md font-semibold", transaction.type === "INCOME" ? "text-primary" : "text-on-surface")}>
                  {transaction.type === "TRANSFER" ? formatNumber(transaction.amount) : formatCurrency(signedAmount(transaction), { sign: true }).replace("PKR ", "")}
                </td>
                <td className="px-5 py-3 text-center">
                  <MaterialIcon name={sourceIcon(transaction.source)} className={transaction.source === "RECEIPT" ? "text-[18px] text-primary" : "text-[18px] text-on-surface-variant"} title={transaction.source} />
                </td>
              </tr>
            ))}
            {!loading && !error && filtered.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-center text-on-surface-variant" colSpan={6}>
                  No transactions found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-outline-variant bg-surface px-5 py-3">
          <span className="label-md text-on-surface-variant">
            {filtered.length ? `Showing ${pageStart + 1}-${Math.min(pageStart + pageSize, filtered.length)} of ${filtered.length} transactions` : "Showing 0 of 0 transactions"}
          </span>
          <div className="flex items-center gap-2">
            <button
              className={cn("rounded-md p-1 text-on-surface-variant hover:bg-surface-container disabled:opacity-50 disabled:hover:bg-transparent", currentPage === 1 && "opacity-50")}
              disabled={currentPage === 1}
              aria-label="Previous page"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <MaterialIcon name="chevron_left" />
            </button>
            {visiblePages(currentPage, totalPages).map((pageNumber) => (
              <button
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md label-md",
                  pageNumber === currentPage ? "bg-primary text-on-primary" : "text-on-surface hover:bg-surface-container",
                )}
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container disabled:opacity-50 disabled:hover:bg-transparent"
              disabled={currentPage === totalPages}
              aria-label="Next page"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              <MaterialIcon name="chevron_right" />
            </button>
          </div>
        </div>
      </Card>
    </>
  );
}

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function visiblePages(currentPage: number, totalPages: number) {
  const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
  const end = Math.min(totalPages, start + 2);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
