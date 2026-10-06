import { AppointmentForm } from "@/components/appointment-form";
import { SetupNeeded, errorMessage } from "@/components/setup-needed";
import { requireUser } from "@/lib/auth";
import { isHHMM, isIsoDate, todayIso } from "@/lib/dates";
import { formContext } from "@/lib/form-data";
import { getTimeZone } from "@/lib/timezone";

export default async function BookPage({ searchParams }: PageProps<"/book">) {
  await requireUser();
  const sp = await searchParams;
  const date = typeof sp.date === "string" && isIsoDate(sp.date) ? sp.date : todayIso(await getTimeZone());
  const start = typeof sp.start === "string" && isHHMM(sp.start) ? sp.start : "10:00";
  const clientId = typeof sp.client === "string" ? sp.client : "";

  let ctx;
  try {
    ctx = await formContext();
  } catch (err) {
    return <SetupNeeded error={errorMessage(err)} />;
  }

  return (
    <div className="space-y-4">
      <h1 className="heading text-2xl">Book an appointment</h1>
      <AppointmentForm
        clients={ctx.options}
        services={ctx.services}
        textingLive={ctx.textingLive}
        initial={{
          clientId: ctx.clients.some((c) => c.id === clientId) ? clientId : "",
          date,
          start,
          durationMin: 60,
          service: "",
          price: "",
          tip: "",
          paymentMethod: "",
          notes: "",
        }}
      />
    </div>
  );
}
