"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPhone } from "@/lib/phone";

export interface ClientRow {
  id: string;
  name: string;
  phone: string;
  lastVisit: string;
  visits: number;
}

export function ClientList({ clients }: { clients: ClientRow[] }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    const digits = s.replace(/\D/g, "");
    if (!s) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(s) || (digits.length >= 3 && c.phone.includes(digits)));
  }, [clients, q]);

  return (
    <div className="space-y-3">
      <input className="input" placeholder={`Search ${clients.length} clients`} value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
        {shown.map((c) => (
          <li key={c.id}>
            <Link href={`/clients/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-panel-2">
              <span>
                <span className="block font-semibold text-white">{c.name}</span>
                <span className="block text-sm text-muted">{c.phone ? formatPhone(c.phone) : "No phone"}</span>
              </span>
              <span className="text-right text-xs text-muted">
                {c.visits} visit{c.visits === 1 ? "" : "s"}
                {c.lastVisit && <span className="block">last {c.lastVisit}</span>}
              </span>
            </Link>
          </li>
        ))}
        {!shown.length && <li className="px-4 py-6 text-center text-muted">No clients found.</li>}
      </ul>
    </div>
  );
}
