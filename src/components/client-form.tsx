"use client";

import { useActionState } from "react";
import { saveClient, type FormState } from "@/app/actions";
import { formatPhone } from "@/lib/phone";
import { SubmitButton } from "./submit-button";

export interface ClientFormValues {
  id?: string;
  name: string;
  phone: string;
  email: string;
  okToText: boolean;
  notes: string;
}

export function ClientForm({ initial }: { initial: ClientFormValues }) {
  const [state, action] = useActionState<FormState, FormData>(saveClient, {});
  return (
    <form action={action} className="space-y-4">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <label className="block">
        <span className="label">Name</span>
        <input className="input" name="name" defaultValue={initial.name} required autoComplete="off" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="label">Mobile</span>
          <input
            className="input"
            name="phone"
            inputMode="tel"
            defaultValue={initial.phone ? formatPhone(initial.phone) : ""}
            autoComplete="off"
          />
        </label>
        <label>
          <span className="label">Email (optional)</span>
          <input className="input" name="email" type="email" defaultValue={initial.email} autoComplete="off" />
        </label>
      </div>
      <label className="flex items-center gap-3 text-sm text-silver">
        <input type="checkbox" name="okToText" defaultChecked={initial.okToText} className="h-5 w-5 accent-[#c8102e]" />
        OK to send appointment texts
      </label>
      <label className="block">
        <span className="label">Notes / color formulas</span>
        <textarea
          className="input min-h-32"
          name="notes"
          defaultValue={initial.notes}
          placeholder="e.g. Roots: 6N + 6G 1:1, 20 vol, 35 min. Toner: 9V…"
        />
      </label>
      {state.error && <p className="text-sm text-ember">{state.error}</p>}
      <SubmitButton>Save client</SubmitButton>
    </form>
  );
}
