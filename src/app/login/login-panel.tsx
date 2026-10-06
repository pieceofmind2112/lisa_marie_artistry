"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(opts: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string }): void;
          renderButton(el: HTMLElement, opts: Record<string, unknown>): void;
        };
      };
    };
  }
}

export function LoginPanel({ clientId, demo }: { clientId: string | null; demo: boolean }) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const finish = useCallback(async (url: string, body?: unknown) => {
    setBusy(true);
    setError(null);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) {
      router.replace("/");
      router.refresh();
      return;
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setError(data.error ?? "Sign-in failed. Try again.");
    setBusy(false);
  }, [router]);

  const renderGoogle = useCallback(() => {
    if (!clientId || !window.google || !buttonRef.current) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: ({ credential }) => finish("/api/auth/google", { credential }),
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "filled_black",
      size: "large",
      shape: "pill",
      text: "signin_with",
      width: 280,
    });
  }, [clientId, finish]);

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-4">
      {clientId ? (
        <>
          <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={renderGoogle} />
          <div ref={buttonRef} className="min-h-11" />
        </>
      ) : (
        !demo && (
          <p className="text-center text-sm text-muted">
            Google sign-in isn&apos;t configured yet. Set GOOGLE_CLIENT_ID (see SETUP.md).
          </p>
        )
      )}
      {demo && (
        <button className="btn btn-ghost w-full" disabled={busy} onClick={() => finish("/api/auth/demo")}>
          Try it in demo mode
        </button>
      )}
      {error && <p className="text-center text-sm text-ember">{error}</p>}
    </div>
  );
}
