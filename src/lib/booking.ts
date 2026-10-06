import "server-only";
import { deleteCalendarEvent, upsertCalendarEvent } from "./calendar";
import { addDays, addMinutes, isHHMM, isIsoDate, todayIso } from "./dates";
import {
  getAppointment,
  getClient,
  insertAppointment,
  insertClient,
  listAppointments,
  listClients,
  newId,
  nowStamp,
  updateAppointment,
  type Appointment,
  type Client,
} from "./data";
import { toE164 } from "./phone";
import { confirmationText, reminderText, rescheduleText, sendSms, type SmsResult } from "./sms";
import { getTimeZone } from "./timezone";

export interface BookingInput {
  clientId?: string;
  newClient?: { name: string; phone: string; okToText: boolean };
  date: string;
  start: string;
  durationMin: number;
  service: string;
  price: number | null;
  tip: number | null;
  paymentMethod: string;
  notes: string;
  sendText: boolean;
}

export interface Outcome {
  id?: string;
  notices: string[];
}

export class UserError extends Error {}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function validateTiming(input: BookingInput) {
  if (!isIsoDate(input.date)) throw new UserError("Pick a date.");
  if (!isHHMM(input.start)) throw new UserError("Pick a start time.");
  if (!Number.isFinite(input.durationMin) || input.durationMin < 5 || input.durationMin > 16 * 60) {
    throw new UserError("Pick a length for the appointment.");
  }
  if (input.price !== null && (input.price < 0 || !Number.isFinite(input.price))) {
    throw new UserError("The value can't be negative.");
  }
}

async function resolveClient(input: BookingInput): Promise<Client> {
  if (input.clientId) {
    const existing = await getClient(input.clientId);
    if (!existing) throw new UserError("That client couldn't be found. Try picking them again.");
    return existing;
  }
  const name = input.newClient?.name.trim() ?? "";
  if (!name) throw new UserError("Pick a client or enter a new client's name.");
  const rawPhone = input.newClient?.phone.trim() ?? "";
  const phone = rawPhone ? toE164(rawPhone) : "";
  if (rawPhone && !phone) throw new UserError("That phone number doesn't look right.");
  const client: Client = {
    id: newId("C"),
    name,
    phone: phone ?? "",
    email: "",
    okToText: Boolean(input.newClient?.okToText && phone),
    notes: "",
    createdAt: nowStamp(),
    updatedAt: nowStamp(),
  };
  await insertClient(client);
  return client;
}

function describeSms(kind: string, r: SmsResult): string {
  if (r.status === "sent") return `${kind} text sent.`;
  if (r.status === "preview") return `Text preview (not sent, texting is off): “${r.body}”`;
  return `${kind} text failed: ${r.error}`;
}

async function textClient(
  a: Appointment,
  client: Client | null,
  kind: string,
  build: (a: Appointment) => string,
  notices: string[],
): Promise<boolean> {
  if (!a.phone) {
    notices.push(`No text sent: ${a.clientName} has no phone number.`);
    return false;
  }
  if (!client?.okToText) {
    notices.push(`No text sent: ${a.clientName} hasn't OK'd texts (turn it on in their client page).`);
    return false;
  }
  const r = await sendSms(a.phone, build(a));
  notices.push(describeSms(kind, r));
  return r.status === "sent";
}

async function syncCalendar(a: Appointment, notices: string[]): Promise<void> {
  try {
    a.calendarEventId = await upsertCalendarEvent(a);
  } catch (err) {
    notices.push(`Saved, but Google Calendar wasn't updated: ${errorText(err)}`);
  }
}

export async function createBooking(input: BookingInput): Promise<Outcome> {
  validateTiming(input);
  const client = await resolveClient(input);
  const notices: string[] = [];
  const a: Appointment = {
    id: newId("A"),
    date: input.date,
    start: input.start,
    end: addMinutes(input.start, input.durationMin),
    clientId: client.id,
    clientName: client.name,
    phone: client.phone,
    service: input.service.trim(),
    price: input.price,
    tip: input.tip,
    paymentMethod: input.paymentMethod,
    status: input.paymentMethod ? "Paid" : "Booked",
    notes: input.notes.trim(),
    calendarEventId: "",
    confirmationSentAt: "",
    reminderSentAt: "",
    createdAt: nowStamp(),
    updatedAt: nowStamp(),
  };
  await syncCalendar(a, notices);
  await insertAppointment(a);

  if (input.sendText && a.status === "Booked") {
    if (await textClient(a, client, "Confirmation", confirmationText, notices)) {
      a.confirmationSentAt = nowStamp();
      await updateAppointment(a);
    }
  }
  return { id: a.id, notices };
}

export async function updateBooking(id: string, input: BookingInput): Promise<Outcome> {
  validateTiming(input);
  const a = await getAppointment(id);
  if (!a) throw new UserError("That appointment no longer exists.");
  const client = await resolveClient(input);
  const notices: string[] = [];

  const newEnd = addMinutes(input.start, input.durationMin);
  const timeChanged = a.date !== input.date || a.start !== input.start;
  Object.assign(a, {
    date: input.date,
    start: input.start,
    end: newEnd,
    clientId: client.id,
    clientName: client.name,
    phone: client.phone,
    service: input.service.trim(),
    price: input.price,
    tip: input.tip,
    paymentMethod: input.paymentMethod,
    notes: input.notes.trim(),
  });
  if (input.paymentMethod) a.status = "Paid";
  else if (a.status === "Paid") a.status = "Booked";
  if (timeChanged) a.reminderSentAt = "";

  if (a.status !== "Cancelled") await syncCalendar(a, notices);
  await updateAppointment(a);

  if (timeChanged && input.sendText && a.status === "Booked") {
    if (await textClient(a, client, "Updated time", rescheduleText, notices)) {
      a.confirmationSentAt = nowStamp();
      await updateAppointment(a);
    }
  }
  return { id: a.id, notices };
}

export async function recordPayment(
  id: string,
  payment: { price: number | null; tip: number | null; paymentMethod: string },
): Promise<Outcome> {
  const a = await getAppointment(id);
  if (!a) throw new UserError("That appointment no longer exists.");
  if (!payment.paymentMethod) throw new UserError("Pick how they paid.");
  const notices: string[] = [];
  Object.assign(a, payment, { status: "Paid" as const });
  await syncCalendar(a, notices);
  await updateAppointment(a);
  return { id, notices };
}

export async function setStatus(id: string, status: "Cancelled" | "No-show" | "Booked"): Promise<Outcome> {
  const a = await getAppointment(id);
  if (!a) throw new UserError("That appointment no longer exists.");
  const notices: string[] = [];
  a.status = status;
  if (status === "Cancelled") {
    try {
      await deleteCalendarEvent(a.calendarEventId);
      a.calendarEventId = "";
    } catch (err) {
      notices.push(`Cancelled, but the Google Calendar event couldn't be removed: ${errorText(err)}`);
    }
  } else {
    if (status === "Booked") {
      a.paymentMethod = "";
    }
    await syncCalendar(a, notices);
  }
  await updateAppointment(a);
  return { id, notices };
}

export async function resendConfirmation(id: string): Promise<Outcome> {
  const a = await getAppointment(id);
  if (!a) throw new UserError("That appointment no longer exists.");
  const client = await getClient(a.clientId);
  const notices: string[] = [];
  if (await textClient(a, client, "Confirmation", confirmationText, notices)) {
    a.confirmationSentAt = nowStamp();
    await updateAppointment(a);
  }
  return { id, notices };
}

/** Texts everyone booked for tomorrow who hasn't had a reminder. Run once a day by the cron job. */
export async function sendDueReminders(now: Date = new Date()) {
  const tz = await getTimeZone();
  const tomorrow = addDays(todayIso(tz, now), 1);
  const [appointments, clients] = await Promise.all([listAppointments(), listClients()]);
  const byId = new Map(clients.map((c) => [c.id, c]));
  const due = appointments.filter((a) => a.date === tomorrow && a.status === "Booked" && !a.reminderSentAt);

  const results: { client: string; result: string }[] = [];
  for (const a of due) {
    const notices: string[] = [];
    if (await textClient(a, byId.get(a.clientId) ?? null, "Reminder", reminderText, notices)) {
      a.reminderSentAt = nowStamp();
      await updateAppointment(a);
    }
    results.push({ client: a.clientName, result: notices.join(" ") });
  }
  return { date: tomorrow, timeZone: tz, considered: due.length, results };
}
