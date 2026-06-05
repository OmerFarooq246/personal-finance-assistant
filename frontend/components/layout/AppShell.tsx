"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { LoginPage } from "@/components/pages/LoginPage";
import { clearAuthTokens, getAccessToken } from "@/lib/api/client";
import { getCurrentUser } from "@/lib/api/users";
import { cn } from "@/lib/finance";
import { useAsyncData } from "@/lib/hooks/useAsyncData";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

type AppShellProps = {
  children: ReactNode;
  chatMode?: boolean;
};

const navItems = [
  { href: "/", label: "Dashboard", icon: "dashboard", mobile: "Home" },
  { href: "/transactions", label: "Transactions", icon: "receipt_long", mobile: "Activity" },
  { href: "/receipts", label: "Receipts", icon: "receipt", mobile: "Receipts" },
  { href: "/chat", label: "Chat", icon: "chat", mobile: "Chat" },
  { href: "/budgets", label: "Budgets", icon: "account_balance_wallet", mobile: "Budgets" },
  { href: "/profile", label: "Profile", icon: "person", mobile: "Profile" },
];

export function AppShell({ children, chatMode = false }: AppShellProps) {
  const pathname = usePathname();
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setIsAuthenticated(Boolean(getAccessToken()));
      setAuthReady(true);
    });
  }, []);

  if (!authReady) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!isAuthenticated) {
    return <LoginPage onSuccess={() => setIsAuthenticated(true)} />;
  }

  function onSignOut() {
    clearAuthTokens();
    setIsAuthenticated(false);
  }

  return (
    <div className={cn("min-h-screen bg-background text-on-surface", chatMode ? "md:h-screen md:overflow-hidden" : "")}>
      <DesktopSidebar pathname={pathname} onSignOut={onSignOut} />
      <MobileTopBar title={activeLabel(pathname)} />
      <main
        className={cn(
          "md:ml-[244px]",
          chatMode
            ? "flex min-h-screen flex-col pt-14 md:h-screen md:min-h-0 md:overflow-hidden md:pt-0"
            : "min-h-screen px-4 pb-20 pt-6 md:px-6 md:pb-8 md:pt-8",
        )}
      >
        <div className={cn(chatMode ? "flex min-h-0 flex-1" : "mx-auto w-full max-w-[1280px]")}>{children}</div>
      </main>
      <MobileBottomNav pathname={pathname} onSignOut={onSignOut} />
    </div>
  );
}

function DesktopSidebar({ pathname, onSignOut }: { pathname: string; onSignOut: () => void }) {
  const loadUser = useCallback(() => getCurrentUser(), []);
  const { data: currentUser } = useAsyncData(loadUser);
  const email = currentUser?.email ?? "Sign in required";
  const displayName = currentUser?.full_name?.trim() || currentUser?.email?.split("@")[0] || "Finance User";

  return (
    <nav className="fixed left-0 top-0 z-40 hidden h-screen w-[244px] flex-col border-r border-outline-variant bg-surface-container-lowest p-2 md:flex">
      <div className="mb-3 flex items-center gap-2.5 px-2.5 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary-container">
          {initials(displayName, currentUser?.email)}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold leading-6 text-primary">{displayName}</h2>
          <p className="truncate label-md text-on-surface-variant">{email}</p>
        </div>
      </div>

      <Link className="mb-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-on-primary transition-colors hover:bg-primary-container" href="/transactions">
        <MaterialIcon name="upload_file" className="text-[16px]" />
        <span className="label-md">Import CSV</span>
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all",
                active
                  ? "bg-secondary-container font-bold text-primary"
                  : "text-on-surface-variant hover:bg-surface-container-high",
              )}
            >
              <MaterialIcon name={item.icon} filled={active} />
              <span className="label-md">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant pt-4">
        <a className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-on-surface-variant transition-all hover:bg-surface-container-high" href="#">
          <MaterialIcon name="help" />
          <span className="label-md">Help</span>
        </a>
        <button className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-on-surface-variant transition-all hover:bg-surface-container-high" type="button" onClick={onSignOut}>
          <MaterialIcon name="logout" />
          <span className="label-md">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}

function MobileTopBar({ title }: { title: string }) {
  return (
    <header className="fixed left-0 top-0 z-40 flex h-14 w-full items-center justify-between border-b border-outline-variant bg-surface px-4 shadow-sm md:hidden">
      <div className="flex items-center gap-2">
        <MaterialIcon name="account_balance_wallet" className="text-primary" />
        <span className="headline-md font-bold text-primary">{title}</span>
      </div>
      <button className="rounded-lg p-2 text-on-surface-variant" aria-label="Open menu">
        <MaterialIcon name="menu" />
      </button>
    </header>
  );
}

function MobileBottomNav({ pathname, onSignOut }: { pathname: string; onSignOut: () => void }) {
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-outline-variant bg-surface px-3 py-1.5 shadow-md md:hidden">
      {navItems.slice(0, 5).map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg p-1.5",
              active ? "font-bold text-primary" : "text-on-surface-variant active:bg-surface-container-high",
            )}
          >
            <MaterialIcon name={item.href === "/chat" ? "chat_bubble" : item.icon} filled={active} />
            <span className="mt-1 text-[10px] leading-3">{item.mobile}</span>
          </Link>
        );
      })}
      <button
        className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg p-1.5 text-on-surface-variant active:bg-surface-container-high"
        type="button"
        onClick={onSignOut}
      >
        <MaterialIcon name="logout" />
        <span className="mt-1 text-[10px] leading-3">Sign Out</span>
      </button>
    </nav>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function activeLabel(pathname: string) {
  return navItems.find((item) => isActive(pathname, item.href))?.label ?? "FinanceAssistant";
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
