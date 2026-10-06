import Link from "next/link";
import { notFound } from "next/navigation";
import { AppointmentCard } from "@/components/appointment-card";
import { ClientForm } from "@/components/client-form";
import { SetupNeeded, errorMessage } from "@/components/setup-needed";
import { requireUser } from "@/lib/auth";
import { getClient, listAppointments } from "@/lib/data";
import { money } from "@/lib/summary";

export default async function ClientPage({ params }: PageProps<"/clients/[id]">) {
  await requireUser();
  const { id } = await params;
  let client, history;
  try {
    client = await getClient(id);
    history = (await listAppointments()).filter((a) => a.clientId === id).reverse();
  } catch (err) {
    return <SetupNeeded error={errorMessage(err)} />;
  }
  if (!client) notFound();
  const paid = history.filter((a) => a.status === "Paid");
  const spent = paid.reduce((t, a) => t + (a.price ?? 0) + (a.tip ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="heading text-2xl">{client.name}</h1>
          <p className="text-sm text-muted">
            {paid.length} paid visit{paid.length === 1 ? "" : "s"} · {money(spent)} total
          </p>
        </div>
        <Link href={`/book?client=${client.id}`} className="btn btn-primary py-2 text-sm">
          Book
        </Link>
      </div>
      <ClientForm initial={client} />
      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="heading text-lg">History</h2>
          {history.map((a) => (
            <div key={a.id} className="space-y-1">
              <AppointmentCard a={a} showDate />
              {a.notes && <p className="px-2 text-sm whitespace-pre-wrap text-muted">{a.notes}</p>}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
