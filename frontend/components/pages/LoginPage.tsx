"use client";

import { FormEvent, useState } from "react";
import { login } from "@/lib/api/auth";
import { createUser } from "@/lib/api/users";
import { cn } from "@/lib/finance";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

type LoginPageProps = {
  onSuccess: () => void;
};

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isSignup && !fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim();
      if (isSignup) {
        await createUser({ email: normalizedEmail, full_name: fullName.trim(), password });
      }
      await login({ email: normalizedEmail, password });
      onSuccess();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : isSignup ? "Could not create account." : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode: "login" | "signup") {
    setMode(nextMode);
    setError(null);
    setConfirmPassword("");
    if (nextMode === "login") setFullName("");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-on-surface sm:px-6">
      <section className="mx-auto grid min-h-[calc(100vh-48px)] w-full max-w-[1120px] grid-cols-1 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex min-h-[360px] flex-col justify-between bg-primary p-6 text-on-primary md:p-8">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-on-primary/15">
                <MaterialIcon name="account_balance_wallet" className="text-[22px]" />
              </div>
              <span className="text-lg font-bold">FinanceAssistant</span>
            </div>
            <h1 className="max-w-md text-4xl font-bold leading-tight md:text-5xl">
              {isSignup ? "Create your finance workspace" : "Sign in to your finance workspace"}
            </h1>
            <p className="mt-4 max-w-md text-on-primary/80">
              {isSignup
                ? "Turn receipts, statements, and budgets into a clear picture of where your money goes."
                : "See cashflow, spending patterns, receipts, and budget progress in one calm workspace."}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <LoginMetric icon="receipt_long" label="Transactions" />
            <LoginMetric icon="receipt" label="Receipts" />
            <LoginMetric icon="chat_bubble" label="Assistant" />
          </div>
        </div>

        <div className="flex items-center justify-center p-5 md:p-8">
          <form className="w-full max-w-sm" onSubmit={onSubmit}>
            <div className="mb-8">
              <p className="label-md uppercase text-on-surface-variant">{isSignup ? "New account" : "Welcome back"}</p>
              <h2 className="mt-2 text-3xl font-bold text-on-surface">{isSignup ? "Create account" : "Log in"}</h2>
            </div>

            <div className="mb-5 grid grid-cols-2 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low">
              <button
                className={cn("px-3 py-2 label-md transition-colors", !isSignup ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high")}
                type="button"
                onClick={() => switchMode("login")}
              >
                Log in
              </button>
              <button
                className={cn("px-3 py-2 label-md transition-colors", isSignup ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high")}
                type="button"
                onClick={() => switchMode("signup")}
              >
                Sign up
              </button>
            </div>

            {isSignup ? (
              <label className="mb-4 block">
                <span className="label-md mb-2 block text-on-surface-variant">Full name</span>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-on-surface outline-none transition-shadow focus:border-primary focus:ring-1 focus:ring-primary"
                  autoComplete="name"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  maxLength={255}
                  required
                />
              </label>
            ) : null}

            <label className="mb-4 block">
              <span className="label-md mb-2 block text-on-surface-variant">Email</span>
              <input
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-on-surface outline-none transition-shadow focus:border-primary focus:ring-1 focus:ring-primary"
                autoComplete="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                minLength={3}
                maxLength={50}
                required
              />
            </label>

            <label className="mb-5 block">
              <span className="label-md mb-2 block text-on-surface-variant">Password</span>
              <input
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-on-surface outline-none transition-shadow focus:border-primary focus:ring-1 focus:ring-primary"
                autoComplete={isSignup ? "new-password" : "current-password"}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </label>

            {isSignup ? (
              <label className="mb-5 block">
                <span className="label-md mb-2 block text-on-surface-variant">Confirm password</span>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-on-surface outline-none transition-shadow focus:border-primary focus:ring-1 focus:ring-primary"
                  autoComplete="new-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </label>
            ) : null}

            {error ? (
              <div className="mb-5 rounded-lg border border-error/30 bg-error-container p-3 text-sm text-error">
                {error}
              </div>
            ) : null}

            <button
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-65",
                loading && "pointer-events-none",
              )}
              disabled={loading}
              type="submit"
            >
              {loading ? <MaterialIcon name="sync" className="animate-spin" /> : <MaterialIcon name="person" />}
              <span>{loading ? (isSignup ? "Creating account..." : "Signing in...") : isSignup ? "Create Account" : "Sign In"}</span>
            </button>

            <p className="mt-4 text-center text-sm text-on-surface-variant">
              {isSignup ? "Your account will be ready right away." : "Use your finance account credentials."}
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

function LoginMetric({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="rounded-lg border border-on-primary/20 bg-on-primary/10 p-3">
      <MaterialIcon name={icon} className="mb-2 text-[20px]" />
      <p className="label-md text-on-primary/85">{label}</p>
    </div>
  );
}
