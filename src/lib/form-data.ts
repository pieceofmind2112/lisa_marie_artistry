import "server-only";
import type { ClientOption } from "@/components/appointment-form";
import { config } from "./config";
import { listAppointments, listClients, type Appointment, type Client } from "./data";
import { smsConfigured } from "./sms";

export function clientOptions(clients: Client[]): ClientOption[] {
  return clients.map((c) => ({ id: c.id, name: c.name, phone: c.phone, okToText: c.okToText }));
}

/** Most-used services first, for the form's suggestions. */
export function recentServices(appointments: Appointment[]): string[] {
  const counts = new Map<string, number>();
  for (const a of appointments) if (a.service) counts.set(a.service, (counts.get(a.service) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s).slice(0, 30);
}

export async function formContext() {
  const [clients, appointments] = await Promise.all([listClients(), listAppointments()]);
  return {
    clients,
    appointments,
    options: clientOptions(clients),
    services: recentServices(appointments),
    textingLive: config.smsMode === "live" && smsConfigured(),
  };
}
