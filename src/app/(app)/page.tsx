import Link from "next/link";
import { AppointmentCard } from "@/components/appointment-card";
import { ChevronLeft, ChevronRight, PlusIcon } from "@/components/icons";
import { SetupNeeded, errorMessage } from "@/components/setup-needed";
import { requireUser } from "@/lib/auth";
import { listAppointments, type Appointment } from "@/lib/data";
import { addDays, formatDate, isIsoDate, todayIso } from "@/lib/dates";
import { money } from "@/lib/summary";
import { getTimeZone } from "@/lib/timezone";

function weekOf(day: string): string[] {
  const dow = new Date(day + "T00:00:00Z").getUTCDay();
  const sunday = addDays(day, -dow);
  return Array.from({ length: 7 }, (_, i) => addDays(sunday, i));
}

export default async function SchedulePage({ searchParams }: PageProps<"/">) {
  await requireUser();
  const sp = await searchParams;
  const today = todayIso(await getTimeZone());
  const day = typeof sp.date === "string" && isIsoDate(sp.date) ? sp.date : today;

  let all: Appointment[];
  try {
    all = await listAppointments();
  } catch (err) {
    return <SetupNeeded error={errorMessage(err)} />;
  }

  const active = all.filter((a) => a.status !== "Cancelled");
  const dayAppts = active.filter((a) => a.date === day);
  const dayTotal = dayAppts.reduce((t, a) => t + (a.price ?? 0) + (a.tip ?? 0), 0);
  const unpaid = all
    .filter((a) => a.status === "Booked" && a.date < today && a.date >= addDays(today, -120))
    .reverse();
  const upcoming = active.filter((a) => a.date > day && a.status === "Booked").slice(0, 5);
  const counts = new Map<string, number>();
  for (const a of active) counts.set(a.date, (counts.get(a.date) ?? 0) + 1);
  const week = weekOf(day);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Link href={`/?date=${addDays(day, -7)}`} className="p-2 text-muted" aria-label="Previous week">
            <ChevronLeft />
          </Link>
          <div className="text-center">
            <h1 className="heading text-2xl">{day === today ? "Today" : formatDate(day, { weekday: "long" })}</h1>
            <p className="text-sm text-muted">{formatDate(day, { weekday: "long", year: true })}</p>
          </div>
          <Link href={`/?date=${addDays(day, 7)}`} className="p-2 text-muted" aria-label="Next week">
            <ChevronRight />
          </Link>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {week.map((d) => {
            const on = d === day;
            const n = counts.get(d) ?? 0;
            return (
              <Link
                key={d}
                href={`/?date=${d}`}
                className={`flex flex-col items-center rounded-xl border py-2 ${on ? "border-ember bg-crimson/20 shadow-[0_0_14px_rgba(255,43,61,0.3)]" : "border-line bg-panel"}`}
              >
                <span className="text-[11px] font-semibold text-muted uppercase">
                  {new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })}
                </span>
                <span className={`text-lg font-semibold ${d === today ? "text-ember" : "text-white"}`}>
                  {Number(d.slice(8))}
                </span>
                <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${n ? "bg-ember" : "bg-transparent"}`} />
              </Link>
            );
          })}
        </div>
        {day !== today && (
          <div className="text-center">
            <Link href="/" className="text-sm font-semibold text-ember">
              Back to today
            </Link>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="heading text-lg">
            {dayAppts.length} appointment{dayAppts.length === 1 ? "" : "s"}
          </h2>
          {dayTotal > 0 && <span className="text-sm text-muted">{money(dayTotal)} booked</span>}
        </div>
        {dayAppts.length ? (
          dayAppts.map((a) => <AppointmentCard key={a.id} a={a} />)
        ) : (
          <div className="card text-center text-muted">Nothing booked.</div>
        )}
        <Link href={`/book?date=${day}`} className="btn btn-primary w-full">
          <PlusIcon width={20} height={20} /> Book an appointment
        </Link>
      </section>

      {unpaid.length > 0 && (
        <section className="space-y-3">
          <h2 className="heading text-lg">Needs payment recorded</h2>
          <p className="-mt-2 text-sm text-muted">Past appointments that haven&apos;t been marked paid, no-show or cancelled.</p>
          {unpaid.slice(0, 8).map((a) => (
            <AppointmentCard key={a.id} a={a} showDate />
          ))}
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="heading text-lg">Coming up</h2>
          {upcoming.map((a) => (
            <AppointmentCard key={a.id} a={a} showDate />
          ))}
        </section>
      )}
    </div>
  );
}
