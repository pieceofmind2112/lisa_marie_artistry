import "server-only";
import { config, isDemoMode } from "./config";
import type { Appointment } from "./data";
import { calendarApi } from "./google";
import { formatPhone } from "./phone";
import { getTimeZone } from "./timezone";

const TOMATO = "11"; // Google Calendar's red, closest to the brand crimson

function money(n: number | null): string {
  return n === null ? "" : `$${n.toFixed(2).replace(/\.00$/, "")}`;
}

function eventBody(a: Appointment, timeZone: string) {
  const lines = [
    a.phone && `Phone: ${formatPhone(a.phone)}`,
    a.price !== null && `Value: ${money(a.price)}`,
    a.status === "Paid" && `Paid${a.paymentMethod ? ` via ${a.paymentMethod}` : ""}${a.tip ? ` (+${money(a.tip)} tip)` : ""}`,
    a.notes && `Notes: ${a.notes}`,
    "",
    "Booked in the LisaMarie Artistry app",
  ].filter((l) => l !== false && l !== undefined && l !== null);
  return {
    summary: `${a.status === "Paid" ? "✓ " : ""}${a.clientName}${a.service ? ` · ${a.service}` : ""}`,
    description: lines.join("\n"),
    colorId: TOMATO,
    start: { dateTime: `${a.date}T${a.start}:00`, timeZone },
    end: { dateTime: `${a.date}T${a.end}:00`, timeZone },
  };
}

function calendarId(): string {
  const id = config.calendarId;
  if (!id) throw new Error("GOOGLE_CALENDAR_ID isn't set. See SETUP.md.");
  return id;
}

/** Creates or updates the appointment's event on Lisa's calendar. Returns the event id. */
export async function upsertCalendarEvent(a: Appointment): Promise<string> {
  if (isDemoMode()) return a.calendarEventId || `demo-${a.id}`;
  const timeZone = await getTimeZone();
  const api = calendarApi();
  const body = eventBody(a, timeZone);
  if (a.calendarEventId) {
    try {
      const res = await api.events.update({ calendarId: calendarId(), eventId: a.calendarEventId, requestBody: body });
      return res.data.id ?? a.calendarEventId;
    } catch (err) {
      // Lisa may have deleted the event by hand; fall through and recreate it.
      if (!isNotFound(err)) throw err;
    }
  }
  const res = await api.events.insert({ calendarId: calendarId(), requestBody: body });
  return res.data.id ?? "";
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  if (isDemoMode() || !eventId) return;
  try {
    await calendarApi().events.delete({ calendarId: calendarId(), eventId });
  } catch (err) {
    if (!isNotFound(err)) throw err;
  }
}

function isNotFound(err: unknown): boolean {
  const code = (err as { code?: number; status?: number })?.code ?? (err as { status?: number })?.status;
  return code === 404 || code === 410;
}
