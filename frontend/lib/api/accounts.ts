import { apiRequest } from "./client";
import { decimalToNumber } from "./normalizers";
import type { Account } from "@/lib/types";

type AccountResponse = Omit<Account, "balance"> & {
  balance: number | string;
};

export async function listAccounts() {
  const accounts = await apiRequest<AccountResponse[]>("/accounts/");
  return accounts.map((account) => ({
    ...account,
    balance: decimalToNumber(account.balance),
  }));
}
