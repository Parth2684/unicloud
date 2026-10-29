"use client";

import { useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/lib/export";

export function BackendAvailability({ children }: { children: React.ReactNode }) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController;

    async function checkHealth() {
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        if (!BACKEND_URL) throw new Error("Backend URL is not configured");
        const healthUrl = `${BACKEND_URL.replace(/\/+$/, "").replace(/\/api\/v1$/, "")}/`;
        const response = await fetch(healthUrl, {
          cache: "no-store",
          signal: controller.signal,
        });
        const healthy = response.ok;
        if (!disposed) setAvailable(healthy);
      } catch {
        if (!disposed) setAvailable(false);
      } finally {
        clearTimeout(timeout);
        if (!disposed) {
          setChecking(false);
          timer = setTimeout(checkHealth, 30_000);
        }
      }
    }

    void checkHealth();
    window.addEventListener("online", retry);

    function retry() {
      setChecking(true);
      setAttempt((value) => value + 1);
    }

    return () => {
      disposed = true;
      clearTimeout(timer);
      controller?.abort();
      window.removeEventListener("online", retry);
    };
  }, [attempt]);

  if (available !== false) return children;

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md text-center" role="status" aria-live="polite">
        <div className="mx-auto mb-8 flex size-20 items-center justify-center rounded-2xl border border-border bg-surface shadow-soft">
          <CloudOff className="size-9 text-primary" aria-hidden="true" />
        </div>
        <p className="mb-3 text-sm font-medium tracking-wide text-primary">UniCloud</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          We’ll be back soon
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Our server is temporarily unavailable. Please try again shortly. We’ll reconnect
          automatically when it’s back online.
        </p>
        {available === false && (
          <div className="mt-8">
            <Button
              disabled={checking}
              onClick={() => {
                setChecking(true);
                setAttempt((value) => value + 1);
              }}
            >
              <RefreshCw className={checking ? "animate-spin" : ""} aria-hidden="true" />
              {checking ? "Checking connection…" : "Try again"}
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              Automatically checks every 30 seconds
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
