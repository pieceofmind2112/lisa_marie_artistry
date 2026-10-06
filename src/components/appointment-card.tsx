import Link from "next/link";
import type { Appointment } from "@/lib/data";
import { formatDate, formatDuration, formatTime, minutesBetween } from "@/lib/dates";
import { money } from "@/lib/summary";

export function StatusBadge({ status }: { status: Appointment["status"] }) {
  const styles: Record<Appointment["status"], string> = {
    Booked: "border-silver/30 text-silver",
    Paid: "border-emerald-500/40 text-emerald-400",
    Cancelled: "border-line text-muted line-through",
    "No-show": "border-ember/50 text-ember",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase ${styles[status]}`}>
      {status}
    </span>
  );
}

export function AppointmentCard({ a, showDate = false }: { a: Appointment; showDate?: boolean }) {
  return (
    <Link
      href={`/appointments/${a.id}`}
      className="card flex items-center gap-4 transition hover:border-crimson/60 active:scale-[0.99]"
    >
      <div className="w-20 shrink-0 border-r border-line pr-3 text-right">
        {showDate && <div className="text-[11px] font-semibold text-ember uppercase">{formatDate(a.date)}</div>}
        <div className="text-base font-semibold text-white">{formatTime(a.start)}</div>
        <div className="text-xs text-muted">{formatDuration(minutesBetween(a.start, a.end))}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-semibold text-white">{a.clientName}</div>
        <div className="truncate text-sm text-muted">{a.service || "Appointment"}</div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-base font-semibold text-silver">{money((a.price ?? 0) + (a.tip ?? 0) || a.price)}</span>
        <StatusBadge status={a.status} />
      </div>
    </Link>
  );
}
