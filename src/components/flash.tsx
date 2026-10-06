"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const COOKIE = "lma_flash";

function parse(raw: string): string[] {
  let value = raw;
  for (let i = 0; i < 3; i++) {
    try {
      const parsed = JSON.parse(value) as { messages?: unknown };
      return Array.isArray(parsed?.messages) ? parsed.messages.map(String) : [];
    } catch {
      try {
        value = decodeURIComponent(value);
      } catch {
        return [];
      }
    }
  }
  return [];
}

/**
 * Shows one-time messages left by server actions (e.g. "Appointment booked. Confirmation text sent.").
 * The layout reads the cookie on the server and passes it in; this clears it so it shows only once.
 */
export function Flash({ raw }: { raw: string }) {
  const pathname = usePathname();
  const [shownOn] = useState(pathname);
  const [open, setOpen] = useState(true);
  const messages = parse(raw);

  useEffect(() => {
    document.cookie = `${COOKIE}=; Max-Age=0; path=/`;
  }, [raw]);

  // The layout persists across navigation, so hide once Lisa moves to another page.
  if (!open || pathname !== shownOn || !messages.length) return null;
  return (
    <div className="card mb-4 flex items-start gap-3 border-crimson/50 shadow-[0_0_18px_rgba(255,43,61,0.18)]" role="status">
      <ul className="flex-1 space-y-1 text-sm text-silver">
        {messages.map((m, i) => (
          <li key={i} className={i === 0 ? "font-semibold text-white" : undefined}>
            {m}
          </li>
        ))}
      </ul>
      <button className="text-muted" aria-label="Dismiss" onClick={() => setOpen(false)}>
        ✕
      </button>
    </div>
  );
}
