import Link from "next/link";
import { ClientList, type ClientRow } from "@/components/client-list";
import { SetupNeeded, errorMessage } from "@/components/setup-needed";
import { requireUser } from "@/lib/auth";
import { listAppointments, listClients } from "@/lib/data";
import { formatDate } from "@/lib/dates";

export default async function ClientsPage() {
  await requireUser();
  let rows: ClientRow[];
  try {
    const [clients, appts] = await Promise.all([listClients(), listAppointments()]);
    rows = clients.map((c) => {
      const visits = appts.filter((a) => a.clientId === c.id && a.status === "Paid");
      const last = visits.at(-1);
      return { id: c.id, name: c.name, phone: c.phone, visits: visits.length, lastVisit: last ? formatDate(last.date, { year: true }) : "" };
    });
  } catch (err) {
    return <SetupNeeded error={errorMessage(err)} />;
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="heading text-2xl">Clients</h1>
        <Link href="/clients/new" className="btn btn-ghost py-2 text-sm">
          + Add client
        </Link>
      </div>
      <ClientList clients={rows} />
    </div>
  );
}
