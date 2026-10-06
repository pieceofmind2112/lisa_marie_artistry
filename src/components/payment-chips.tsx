"use client";

import { PAYMENT_METHODS } from "@/lib/constants";

export function PaymentChips({
  value,
  onChange,
  allowNone = true,
  noneLabel = "Not paid yet",
}: {
  value: string;
  onChange: (v: string) => void;
  allowNone?: boolean;
  noneLabel?: string;
}) {
  const options = allowNone ? ["", ...PAYMENT_METHODS] : [...PAYMENT_METHODS];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((m) => (
        <button
          key={m || "none"}
          type="button"
          className={`chip ${value === m ? "chip-on" : ""}`}
          aria-pressed={value === m}
          onClick={() => onChange(m)}
        >
          {m || noneLabel}
        </button>
      ))}
    </div>
  );
}
