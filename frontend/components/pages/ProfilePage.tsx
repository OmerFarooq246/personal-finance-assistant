"use client";

import { useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { PageHeader } from "@/components/ui/PageHeader";
import { listAccounts } from "@/lib/api/accounts";
import { listUserContext } from "@/lib/api/user-context";
import { getCurrentUser } from "@/lib/api/users";
import { formatCurrency, formatDate } from "@/lib/finance";
import { useAsyncData } from "@/lib/hooks/useAsyncData";
import type { Account, User, UserContext } from "@/lib/types";

type ProfileData = {
  accounts: Account[];
  currentUser: User;
  userContext: UserContext[];
};

export function ProfilePage() {
  const loadProfile = useCallback(async () => {
    const [currentUser, accounts, userContext] = await Promise.all([
      getCurrentUser(),
      listAccounts(),
      listUserContext(),
    ]);
    return { accounts, currentUser, userContext };
  }, []);
  const { data, error, loading } = useAsyncData<ProfileData>(loadProfile);
  const accounts = data?.accounts ?? [];
  const userContext = data?.userContext ?? [];
  const currentUser = data?.currentUser ?? null;
  const displayName = currentUser?.full_name?.trim() || currentUser?.email?.split("@")[0] || "Signed-in user";
  const totalBalance = accounts.reduce((total, account) => total + account.balance, 0);

  return (
    <>
      <PageHeader title="Profile" description="User identity, remembered context, and known accounts." />

      {loading ? <div className="mb-4 rounded-lg border border-outline-variant bg-surface-container-low p-3 text-on-surface-variant">Loading profile...</div> : null}
      {error ? <div className="mb-4 rounded-lg border border-error/30 bg-error-container p-3 text-error">{error}</div> : null}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col gap-6">
          <Card className="p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-lg font-bold text-on-primary-container">{initials(displayName, currentUser?.email)}</div>
              <div>
                <h2 className="headline-md">{displayName}</h2>
                <p className="text-on-surface-variant">{currentUser?.email ?? "No user loaded"}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 border-t border-outline-variant pt-5">
              <div>
                <dt className="label-md uppercase text-on-surface-variant">Role</dt>
                <dd className="mt-1 font-medium text-on-surface">{currentUser?.role ?? "--"}</dd>
              </div>
              <div>
                <dt className="label-md uppercase text-on-surface-variant">Joined</dt>
                <dd className="mt-1 font-medium text-on-surface">{currentUser ? formatDate(currentUser.created_at) : "--"}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-4">
            <span className="label-md uppercase text-on-surface-variant">Net Known Balance</span>
            <p className="mt-2 numeral-lg text-primary">{formatCurrency(totalBalance)}</p>
            <p className="mt-2 text-on-surface-variant">Total across connected accounts.</p>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="headline-md">Accounts</h2>
              <span className="label-md text-on-surface-variant">{accounts.length} records</span>
            </div>
            <div className="divide-y divide-surface-container">
              {accounts.map((account) => (
                <div className="flex items-center justify-between gap-3 py-3" key={account.id}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-surface-container text-on-surface-variant">
                      <MaterialIcon name={account.type === "Credit Card" ? "credit_card" : "account_balance"} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-on-surface">{account.name}</p>
                      <p className="label-md text-on-surface-variant">{account.type} • {account.currency}</p>
                    </div>
                  </div>
                  <span className={account.balance < 0 ? "numeral-md text-error" : "numeral-md text-on-surface"}>{formatCurrency(account.balance)}</span>
                </div>
              ))}
              {!accounts.length ? <p className="py-3 text-on-surface-variant">No accounts found.</p> : null}
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="headline-md">Saved Context</h2>
            </div>
            <div className="flex flex-col gap-3">
              {userContext.map((item) => (
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3" key={item.id}>
                  <p className="text-on-surface">{item.context}</p>
                  <p className="mt-2 label-md text-on-surface-variant">Saved {formatDate(item.created_at)}</p>
                </div>
              ))}
              {!userContext.length ? <p className="text-on-surface-variant">No saved context found.</p> : null}
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}

function initials(name?: string, email?: string) {
  const source = name || email?.split("@")[0];
  if (!source) return "--";
  return source
    .split(/[\s._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
