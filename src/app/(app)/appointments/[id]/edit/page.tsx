import { notFound } from "next/navigation";
import { AppointmentForm } from "@/components/appointment-form";
import { SetupNeeded, errorMessage } from "@/components/setup-needed";
import { requireUser } from "@/lib/auth";
import { minutesBetween } from "@/lib/dates";
import { formContext } from "@/lib/form-data";

export default async function EditAppointmentPage({ params }: PageProps<"/appointments/[id]/edit">) {
  await requireUser();
  const { id } = await params;
  let ctx;
  try {
    ctx = await formContext();
  } catch (err) {
    return <SetupNeeded error={errorMessage(err)} />;
  }
  const a = ctx.appointments.find((x) => x.id === id);
  if (!a) notFound();

  return (
    <div className="space-y-4">
      <h1 className="heading text-2xl">Edit appointment</h1>
      <AppointmentForm
        clients={ctx.options}
        services={ctx.services}
        textingLive={ctx.textingLive}
        initial={{
          id: a.id,
          clientId: a.clientId,
          date: a.date,
          start: a.start,
          durationMin: Math.max(5, minutesBetween(a.start, a.end)),
          service: a.service,
          price: a.price === null ? "" : String(a.price),
          tip: a.tip === null ? "" : String(a.tip),
          paymentMethod: a.paymentMethod,
          notes: a.notes,
        }}
      />
    </div>
  );
}
