import { apiRequest } from "./client";
import { toNumber } from "./normalizers";
import type { Receipt } from "@/lib/types";

type ReceiptResponse = Omit<Receipt, "total_amount"> & {
  total_amount?: number | string | null;
};

export async function listReceipts() {
  const receipts = await apiRequest<ReceiptResponse[]>("/receipts/");
  return receipts.map(normalizeReceipt);
}

export async function uploadReceipt(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const receipt = await apiRequest<ReceiptResponse>("/receipts/upload", {
    method: "POST",
    body: formData,
  });
  return normalizeReceipt(receipt);
}

function normalizeReceipt(receipt: ReceiptResponse): Receipt {
  return {
    ...receipt,
    total_amount: toNumber(receipt.total_amount),
  };
}
