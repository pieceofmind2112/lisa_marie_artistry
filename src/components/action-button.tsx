"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions";

export function ActionButton({
  action,
  children,
  confirmText,
  className = "btn btn-ghost w-full",
}: {
  action: () => Promise<FormState>;
  children: React.ReactNode;
  confirmText?: string;
  className?: string;
}) {
  const [state, run, pending] = useActionState<FormState>(() => action(), {});
  return (
    <form
      action={run}
      onSubmit={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <button className={className} disabled={pending}>
        {pending ? "Working…" : children}
      </button>
      {state.error && <p className="mt-2 text-sm text-ember">{state.error}</p>}
    </form>
  );
}
