"use client";

import { useActionState, useMemo, useState } from "react";
import { saveAppointment, type FormState } from "@/app/actions";
import { DURATION_PRESETS } from "@/lib/constants";
import { formatDuration } from "@/lib/dates";
import { formatPhone } from "@/lib/phone";
import { PaymentChips } from "./payment-chips";
import { SubmitButton } from "./submit-button";

export interface ClientOption {
  id: string;
  name: string;
  phone: string;
  okToText: boolean;
}

export interface AppointmentFormValues {
  id?: string;
  clientId: string;
  date: string;
  start: string;
  durationMin: number;
  service: string;
  price: string;
  tip: string;
  paymentMethod: string;
  notes: string;
}

export function AppointmentForm({
  clients,
  initial,
  services,
  textingLive,
}: {
  clients: ClientOption[];
  initial: AppointmentFormValues;
  services: string[];
  textingLive: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveAppointment, {});
  const editing = Boolean(initial.id);

  const [clientId, setClientId] = useState(initial.clientId);
  const [query, setQuery] = useState("");
  const [newClient, setNewClient] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newOk, setNewOk] = useState(true);
  const [duration, setDuration] = useState(initial.durationMin);
  const [paymentMethod, setPaymentMethod] = useState(initial.paymentMethod);

  const selected = clients.find((c) => c.id === clientId) ?? null;
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const digits = q.replace(/\D/g, "");
    return clients
      .filter((c) => c.name.toLowerCase().includes(q) || (digits.length >= 3 && c.phone.includes(digits)))
      .slice(0, 6);
  }, [clients, query]);

  const canText = selected ? selected.okToText && Boolean(selected.phone) : newClient && newOk && Boolean(newPhone);

  return (
    <form action={action} className="space-y-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="clientId" value={newClient ? "" : clientId} />
      <input type="hidden" name="duration" value={duration} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />

      {/* Client */}
      <div>
        <span className="label">Client</span>
        {selected && !newClient ? (
          <div className="card flex items-center justify-between gap-3 py-3">
            <div>
              <div className="font-semibold text-white">{selected.name}</div>
              <div className="text-sm text-muted">
                {selected.phone ? formatPhone(selected.phone) : "No phone"}
                {selected.phone && !selected.okToText && " · texts off"}
              </div>
            </div>
            <button type="button" className="text-sm font-semibold text-ember" onClick={() => setClientId("")}>
              Change
            </button>
          </div>
        ) : newClient ? (
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">New client</span>
              <button type="button" className="text-sm font-semibold text-ember" onClick={() => setNewClient(false)}>
                Pick existing
              </button>
            </div>
            <input
              className="input"
              name="newClientName"
              placeholder="Full name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoComplete="off"
              required
            />
            <input
              className="input"
              name="newClientPhone"
              placeholder="Mobile number"
              inputMode="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              autoComplete="off"
            />
            <label className="flex items-center gap-3 text-sm text-silver">
              <input
                type="checkbox"
                name="newClientOkToText"
                checked={newOk}
                onChange={(e) => setNewOk(e.target.checked)}
                className="h-5 w-5 accent-[#c8102e]"
              />
              They said OK to appointment texts
            </label>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              className="input"
              placeholder="Search clients by name or phone"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              autoFocus={!editing}
            />
            {matches.map((c) => (
              <button
                key={c.id}
                type="button"
                className="card flex w-full items-center justify-between py-3 text-left hover:border-crimson/60"
                onClick={() => {
                  setClientId(c.id);
                  setQuery("");
                }}
              >
                <span className="font-semibold text-white">{c.name}</span>
                <span className="text-sm text-muted">{c.phone ? formatPhone(c.phone) : ""}</span>
              </button>
            ))}
            <button
              type="button"
              className="btn btn-ghost w-full"
              onClick={() => {
                setNewClient(true);
                setNewName(query.trim());
                setQuery("");
              }}
            >
              + New client{query.trim() ? `: ${query.trim()}` : ""}
            </button>
          </div>
        )}
      </div>

      {/* When */}
      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="label">Date</span>
          <input className="input" type="date" name="date" defaultValue={initial.date} required />
        </label>
        <label>
          <span className="label">Start</span>
          <input className="input" type="time" name="start" step={300} defaultValue={initial.start} required />
        </label>
      </div>

      <div>
        <span className="label">Length · {formatDuration(duration)}</span>
        <div className="flex flex-wrap gap-2">
          {DURATION_PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              className={`chip ${duration === m ? "chip-on" : ""}`}
              aria-pressed={duration === m}
              onClick={() => setDuration(m)}
            >
              {formatDuration(m)}
            </button>
          ))}
          <input
            className="input w-28 py-2"
            type="number"
            min={5}
            step={5}
            inputMode="numeric"
            aria-label="Custom length in minutes"
            placeholder="min"
            value={DURATION_PRESETS.includes(duration) ? "" : duration}
            onChange={(e) => e.target.value && setDuration(Number(e.target.value))}
          />
        </div>
      </div>

      {/* What */}
      <div className="grid grid-cols-[1fr_8rem] gap-3">
        <label>
          <span className="label">Service (optional)</span>
          <input
            className="input"
            name="service"
            list="services"
            placeholder="Color, cut, bridal…"
            defaultValue={initial.service}
            autoComplete="off"
          />
          <datalist id="services">
            {services.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <label>
          <span className="label">Value</span>
          <input
            className="input"
            name="price"
            inputMode="decimal"
            placeholder="$0"
            defaultValue={initial.price}
            autoComplete="off"
          />
        </label>
      </div>

      <div>
        <span className="label">Payment</span>
        <PaymentChips value={paymentMethod} onChange={setPaymentMethod} />
        {paymentMethod && (
          <label className="mt-3 block w-40">
            <span className="label">Tip (optional)</span>
            <input className="input" name="tip" inputMode="decimal" placeholder="$0" defaultValue={initial.tip} />
          </label>
        )}
      </div>

      <label className="block">
        <span className="label">Notes (optional)</span>
        <textarea
          className="input min-h-24"
          name="notes"
          placeholder="Color formula, special requests…"
          defaultValue={initial.notes}
        />
      </label>

      {!paymentMethod && (
        <label className={`flex items-start gap-3 text-sm ${canText ? "text-silver" : "text-muted"}`}>
          <input
            type="checkbox"
            name="sendText"
            defaultChecked
            disabled={!canText && !newClient && !selected}
            className="mt-0.5 h-5 w-5 accent-[#c8102e]"
          />
          <span>
            {editing ? "Text the client if the date or time changes" : "Text the client a confirmation"}
            {!textingLive && <span className="block text-xs text-muted">Texting is off for now, so you&apos;ll see a preview instead.</span>}
            {(selected || newClient) && !canText && (
              <span className="block text-xs text-muted">This client has no mobile number or hasn&apos;t OK&apos;d texts.</span>
            )}
          </span>
        </label>
      )}

      {state.error && <p className="rounded-xl border border-ember/50 bg-crimson/10 p-3 text-sm text-white">{state.error}</p>}

      <SubmitButton pendingText={editing ? "Saving…" : "Booking…"}>{editing ? "Save changes" : "Book it"}</SubmitButton>
    </form>
  );
}
