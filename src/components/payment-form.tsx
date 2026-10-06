"use client";

import { useActionState, useState } from "react";
import { savePayment, type FormState } from "@/app/actions";
import { PaymentChips } from "./payment-chips";
import { SubmitButton } from "./submit-button";

export function PaymentForm({ id, price, tip }: { id: string; price: number | null; tip: number | null }) {
  const [state, action] = useActionState<FormState, FormData>(savePayment, {});
  const [method, setMethod] = useState("");
  return (
    <form action={action} className="card space-y-4">
      <h2 className="heading text-lg">Record payment</h2>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="paymentMethod" value={method} />
      <PaymentChips value={method} onChange={setMethod} allowNone={false} />
      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="label">Value</span>
          <input className="input" name="price" inputMode="decimal" placeholder="$0" defaultValue={price ?? ""} />
        </label>
        <label>
          <span className="label">Tip (optional)</span>
          <input className="input" name="tip" inputMode="decimal" placeholder="$0" defaultValue={tip ?? ""} />
        </label>
      </div>
      {state.error && <p className="text-sm text-ember">{state.error}</p>}
      <SubmitButton>Mark paid</SubmitButton>
    </form>
  );
}
