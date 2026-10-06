import Link from "next/link";
import { notFound } from "next/navigation";
import { changeStatus, resendText } from "@/app/actions";
import { ActionButton } from "@/components/action-button";
import { StatusBadge } from "@/components/appointment-card";
import { PaymentForm } from "@/components/payment-form";
import { SetupNeeded, errorMessage } from "@/components/setup-needed";
import { requireUser } from "@/lib/auth";
import { getAppointment, getClient } from "@/lib/data";
import { formatDate, formatDuration, formatTime, minutesBetween } from "@/lib/dates";
import { formatPhone } from "@/lib/phone";
import { money } from "@/lib/summary";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-white">{children}</span>
    </div>
  );
}

export default async function AppointmentPage({ params }: PageProps<"/appointments/[id]">) {
  await requireUser();
  const { id } = await params;
  let a, client;
  try {
    a = await getAppointment(id);
    client = a ? await getClient(a.clientId) : null;
  } catch (err) {
    return <SetupNeeded error={errorMessage(err)} />;
  }
  if (!a) notFound();

  const open = a.status === "Booked";
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="heading text-2xl">{a.clientName}</h1>
          <StatusBadge status={a.status} />
        </div>
        <p className="text-silver">
          {formatDate(a.date, { weekday: "long", year: true })} · {formatTime(a.start)}–{formatTime(a.end)}
        </p>
      </div>

      <div className="card py-1">
        <Row label="Service">{a.service || "—"}</Row>
        <Row label="Length">{formatDuration(minutesBetween(a.start, a.end))}</Row>
        <Row label="Value">{money(a.price, { cents: true })}</Row>
        {a.status === "Paid" && (
          <>
            <Row label="Paid with">{a.paymentMethod}</Row>
            <Row label="Tip">{money(a.tip ?? 0, { cents: true })}</Row>
          </>
        )}
        <Row label="Phone">
          {a.phone ? (
            <a className="text-ember" href={`tel:${a.phone}`}>
              {formatPhone(a.phone)}
            </a>
          ) : (
            "—"
          )}
        </Row>
        <Row label="Confirmation text">
          {a.confirmationSentAt ? new Date(a.confirmationSentAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Not sent"}
        </Row>
        <Row label="Reminder text">
          {a.reminderSentAt ? new Date(a.reminderSentAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Not sent"}
        </Row>
      </div>

      {a.notes && (
        <div className="card">
          <span className="label">Appointment notes</span>
          <p className="whitespace-pre-wrap text-silver">{a.notes}</p>
        </div>
      )}
      {client?.notes && (
        <div className="card">
          <span className="label">Client notes / color formulas</span>
          <p className="whitespace-pre-wrap text-silver">{client.notes}</p>
        </div>
      )}

      {(open || a.status === "No-show") && <PaymentForm id={a.id} price={a.price} tip={a.tip} />}

      <div className="grid grid-cols-2 gap-3">
        <Link href={`/appointments/${a.id}/edit`} className="btn btn-ghost">
          Edit
        </Link>
        <Link href={`/clients/${a.clientId}`} className="btn btn-ghost">
          Client
        </Link>
        <Link href={`/book?client=${a.clientId}`} className="btn btn-ghost">
          Book again
        </Link>
        {open && a.phone && (
          <ActionButton action={resendText.bind(null, a.id)}>Resend text</ActionButton>
        )}
        {open && (
          <ActionButton action={changeStatus.bind(null, a.id, "No-show")} confirmText="Mark this appointment as a no-show?">
            No-show
          </ActionButton>
        )}
        {a.status !== "Cancelled" && (
          <ActionButton
            action={changeStatus.bind(null, a.id, "Cancelled")}
            confirmText="Cancel this appointment? It will be removed from Google Calendar."
            className="btn btn-danger w-full"
          >
            Cancel appt
          </ActionButton>
        )}
        {(a.status === "Cancelled" || a.status === "No-show" || a.status === "Paid") && (
          <ActionButton
            action={changeStatus.bind(null, a.id, "Booked")}
            confirmText={a.status === "Paid" ? "Undo the payment and mark it booked again?" : "Restore this appointment?"}
          >
            {a.status === "Paid" ? "Undo payment" : "Restore"}
          </ActionButton>
        )}
      </div>
    </div>
  );
}
