"use client";

import { useActionState, useRef, useState } from "react";
import { addExpense, type FormState } from "@/app/actions";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/constants";
import { SubmitButton } from "./submit-button";

export function ExpenseForm({ today }: { today: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await addExpense(prev, fd);
    if (!result.error) formRef.current?.reset();
    return result;
  }, {});

  if (!open) {
    return (
      <button className="btn btn-ghost w-full" onClick={() => setOpen(true)}>
        + Log an expense
      </button>
    );
  }
  return (
    <form ref={formRef} action={action} className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="heading text-lg">Log an expense</h2>
        <button type="button" className="text-sm text-muted" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
      <div className="grid grid-cols-[1fr_8rem] gap-3">
        <label>
          <span className="label">Item / store</span>
          <input className="input" name="item" placeholder="Sally Beauty, shears…" autoComplete="off" required />
        </label>
        <label>
          <span className="label">Amount</span>
          <input className="input" name="amount" inputMode="decimal" placeholder="$0" required />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="label">Date</span>
          <input className="input" type="date" name="date" defaultValue={today} required />
        </label>
        <label>
          <span className="label">Paid with</span>
          <select className="input" name="paymentMethod" defaultValue="">
            <option value="">—</option>
            {PAYMENT_METHODS.filter((m) => m !== "Trade").map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="label">Category</span>
        <select className="input" name="category" defaultValue={EXPENSE_CATEGORIES[0]}>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">Notes (optional)</span>
        <input className="input" name="notes" autoComplete="off" />
      </label>
      {state.error && <p className="text-sm text-ember">{state.error}</p>}
      {state.messages && <p className="text-sm text-emerald-400">{state.messages.join(" ")}</p>}
      <SubmitButton>Save expense</SubmitButton>
    </form>
  );
}
