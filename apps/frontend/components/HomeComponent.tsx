"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCloudStore } from "@/stores/cloud/useCloudStore";
import { Spinner } from "@/components/ui/spinner";
import { BACKEND_URL } from "@/lib/export";
import type { ErrorCloudAccount, SuccessCloudAccount } from "@/stores/cloud/types";
import { formatBytes, getUsagePercentage } from "@/utils/format";
import { Button } from "@/components/ui/button";

export const HomeComponent = () => {
  const { setClouds, successCloudAccounts, errorCloudAccounts, loading } = useCloudStore();

  useEffect(() => {
    setClouds();
  }, [setClouds]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Cloud accounts</h1>
        <p className="text-sm text-muted-foreground">
          Choose a linked cloud account to open its drive. Storage usage and provider are shown
          below.
        </p>
      </header>

      {loading ? (
        <div className="flex min-h-[160px] items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Linked accounts
            </h2>
            {Array.isArray(successCloudAccounts) && successCloudAccounts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {successCloudAccounts.map((acc) => (
                  <CloudAccountCard key={acc.info.id} account={acc} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                No cloud accounts are linked yet. Use Add Drive in the sidebar to connect Google
                Drive.
              </div>
            )}
          </section>

          {Array.isArray(errorCloudAccounts) && errorCloudAccounts.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold tracking-wide text-warning uppercase">
                Attention needed
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {errorCloudAccounts.map((acc) => (
                  <ErrorAccountCard key={acc.id} account={acc} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

function CloudAccountCard({ account }: { account: SuccessCloudAccount }) {
  const { info, storageQuota } = account;
  const usage = formatBytes(storageQuota.usage);
  const limitLabel = storageQuota.limit ? formatBytes(storageQuota.limit) : null;
  const percentage = getUsagePercentage(storageQuota.usage, storageQuota.limit ?? null);
  const deleteDrive = useCloudStore((s) => s.deleteDrive);

  return (
    <Link
      href={`/google/${info.id}`}
      className="group relative flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-destructive"
        aria-label="Delete cloud account"
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await deleteDrive(info.id);
        }}
      >
        <Trash2 className="size-4" />
      </Button>
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold">
          {info.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="size-full object-cover" src={info.image} alt="" />
          ) : (
            <span>{info.email[0].toUpperCase()}</span>
          )}
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">{info.email}</span>
          <span className="text-xs text-muted-foreground">{info.provider}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {usage}
            {limitLabel && ` of ${limitLabel}`}
          </span>
          <span>{Math.round(percentage)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

function ErrorAccountCard({ account }: { account: ErrorCloudAccount }) {
  const deleteDrive = useCloudStore((s) => s.deleteDrive);

  return (
    <a
      href={`${BACKEND_URL}/auth/drive`}
      className="relative flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 text-left shadow-soft transition hover:-translate-y-0.5"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-destructive"
        aria-label="Delete cloud account"
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await deleteDrive(account.id);
        }}
      >
        <Trash2 className="size-4" />
      </Button>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">{account.email}</span>
          <span className="text-xs text-muted-foreground">{account.provider}</span>
        </div>
        {account.tokenExpired && (
          <span className="rounded-md bg-warning/20 px-2 py-0.5 text-xs font-medium text-foreground">
            Session expired
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Tap to reconnect this account.</p>
    </a>
  );
}
