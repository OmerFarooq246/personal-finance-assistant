"use client";

import { useCallback, useState } from "react";
import { Card } from "@/components/ui/Card";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { PageHeader } from "@/components/ui/PageHeader";
import { listReceipts, uploadReceipt } from "@/lib/api/receipts";
import { cn, formatCurrency, formatDate, formatNumber, shortDate, statusBadgeClass, statusIcon } from "@/lib/finance";
import { useAsyncData } from "@/lib/hooks/useAsyncData";

export function ReceiptsPage() {
  const loadReceipts = useCallback(() => listReceipts(), []);
  const { data: receipts, error, loading, reload } = useAsyncData(loadReceipts);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const receiptRows = receipts ?? [];
  const selected = receiptRows.find((receipt) => receipt.id === selectedId) ?? receiptRows[0] ?? null;

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    setUploadMessage(null);
    try {
      const receipt = await uploadReceipt(file);
      setSelectedId(receipt.id);
      setUploadMessage(`${receipt.file_name} uploaded.`);
      await reload();
    } catch (caught) {
      setUploadMessage(caught instanceof Error ? caught.message : "Receipt upload failed.");
    } finally {
      setProcessing(false);
      event.target.value = "";
    }
  }

  return (
    <>
      <PageHeader title="Receipts" description="Manage and process your uploaded receipts." />

      <label className="mb-6 flex min-h-[170px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-5 text-center transition-colors hover:bg-surface-bright md:p-6">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low text-primary">
          <MaterialIcon name={processing ? "sync" : "cloud_upload"} className={cn("text-xl", processing && "animate-spin")} />
        </div>
        <h2 className="headline-md mb-2">{processing ? "Processing receipt" : "Upload new receipt"}</h2>
        <p className="mb-4 text-on-surface-variant">
          {processing ? "Extracting totals and context from your receipt." : "Drag and drop images or PDFs here, or click to browse."}
        </p>
        {uploadMessage ? <p className="mb-3 label-md text-primary">{uploadMessage}</p> : null}
        <span className="rounded-lg bg-primary px-5 py-1.5 label-md text-on-primary transition-colors hover:bg-primary-container">Select Files</span>
        <input className="sr-only" type="file" accept="image/*,application/pdf" onChange={onFileChange} />
      </label>

      {loading ? <div className="mb-4 rounded-lg border border-outline-variant bg-surface-container-low p-3 text-on-surface-variant">Loading receipts...</div> : null}
      {error ? <div className="mb-4 rounded-lg border border-error/30 bg-error-container p-3 text-error">{error}</div> : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.55fr)]">
        <Card className="overflow-hidden shadow-sm">
            <div className="hidden grid-cols-12 gap-4 border-b border-outline-variant bg-surface-container-low px-5 py-3 label-md uppercase text-on-surface-variant sm:grid">
            <div className="col-span-1">ID</div>
            <div className="col-span-5">File Details</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-right">Date</div>
          </div>
          <div className="divide-y divide-outline-variant">
            {receiptRows.map((receipt) => (
              <button
                className={cn(
                  "grid w-full grid-cols-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-bright sm:grid-cols-12 sm:px-5",
                  selectedId === receipt.id && "bg-surface-container-low",
                )}
                key={receipt.id}
                onClick={() => setSelectedId(receipt.id)}
              >
                <div className="hidden label-md text-on-surface-variant sm:col-span-1 sm:block">#{receipt.id}</div>
                <div className="flex min-w-0 items-center gap-3 sm:col-span-5">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded", iconTone(receipt.processing_status))}>
                    <MaterialIcon name={receipt.file_name.endsWith(".pdf") ? "picture_as_pdf" : receipt.processing_status === "FAILED" ? "image_not_supported" : "image"} className="text-sm" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-on-surface">{receipt.file_name}</p>
                    <p className="label-md text-on-surface-variant sm:hidden">#{receipt.id} • {shortDate(receipt.created_at)}</p>
                  </div>
                </div>
                <div className="sm:col-span-2 sm:text-right">
                  <p className={receipt.total_amount ? "numeral-md text-on-surface" : "numeral-md text-on-surface-variant opacity-50"}>
                    {receipt.total_amount ? formatNumber(receipt.total_amount) : "--"}
                  </p>
                </div>
                <div className="flex justify-end sm:col-span-2 sm:justify-center">
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 label-md", statusBadgeClass(receipt.processing_status))}>
                    <MaterialIcon name={statusIcon(receipt.processing_status)} className={cn("text-[12px]", receipt.processing_status === "PROCESSING" && "animate-spin")} />
                    {receipt.processing_status.replace("_", " ")}
                  </span>
                </div>
                <div className="hidden text-right text-on-surface-variant sm:col-span-2 sm:block">{shortDate(receipt.created_at)}</div>
              </button>
            ))}
            {!loading && !error && receiptRows.length === 0 ? (
              <div className="p-6 text-center text-on-surface-variant">No receipts uploaded yet.</div>
            ) : null}
          </div>
        </Card>

        <Card className="p-4">
          {selected ? (
            <>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="headline-md">Receipt Context</h2>
                  <p className="mt-1 text-on-surface-variant">Read-only extracted details.</p>
                </div>
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 label-md", statusBadgeClass(selected.processing_status))}>
                  <MaterialIcon name={statusIcon(selected.processing_status)} className="text-[12px]" />
                  {selected.processing_status.replace("_", " ")}
                </span>
              </div>

              <dl className="grid grid-cols-1 gap-3 border-b border-outline-variant pb-4 text-sm">
                <div>
                  <dt className="label-md uppercase text-on-surface-variant">File</dt>
                  <dd className="mt-1 font-medium text-on-surface">{selected.file_name}</dd>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="label-md uppercase text-on-surface-variant">Amount</dt>
                    <dd className="mt-1 numeral-md text-on-surface">{selected.total_amount ? formatCurrency(selected.total_amount) : "Pending"}</dd>
                  </div>
                  <div>
                    <dt className="label-md uppercase text-on-surface-variant">Created</dt>
                    <dd className="mt-1 text-on-surface">{formatDate(selected.created_at)}</dd>
                  </div>
                </div>
              </dl>

              <div className="mt-5">
                <h3 className="label-md mb-2 uppercase text-on-surface-variant">Raw Text</h3>
                <div className="min-h-24 rounded-lg border border-outline-variant bg-surface-container-low p-3 text-sm leading-6 text-on-surface">
                  {selected.raw_text ?? "No raw text available yet."}
                </div>
              </div>

              <div className="mt-5">
                <h3 className="label-md mb-2 uppercase text-on-surface-variant">Extracted Data</h3>
                <pre className="max-h-80 overflow-auto rounded-lg border border-outline-variant bg-surface-container-low p-3 text-xs leading-5 text-on-surface">
                  {JSON.stringify(selected.extracted_data ?? {}, null, 2)}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex min-h-64 items-center justify-center text-center text-on-surface-variant">
              Select or upload a receipt to view extracted details.
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function iconTone(status: string) {
  if (status === "FAILED") return "bg-error-container text-error";
  if (status === "PROCESSING") return "bg-surface-container text-on-surface-variant";
  return "bg-secondary-container text-primary";
}
