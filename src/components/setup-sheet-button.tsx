"use client";

import { useActionState } from "react";
import { runSheetSetup, type FormState } from "@/app/actions";

export function SetupSheetButton() {
  const [state, run, pending] = useActionState<FormState>(() => runSheetSetup(), {});
  return (
    <form action={run} className="space-y-2">
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Setting up…" : "Set up the sheet"}
      </button>
      {state.error && <p className="text-sm text-ember">{state.error}</p>}
      {state.messages?.map((m) => (
        <p key={m} className="text-sm text-emerald-400">
          {m}
        </p>
      ))}
    </form>
  );
}
