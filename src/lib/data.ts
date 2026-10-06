import "server-only";
import { config, isDemoMode } from "./config";
import type { AppointmentStatus } from "./constants";
import type { TableBackend } from "./store/backend";
import { JsonBackend } from "./store/json-backend";
import { APPOINTMENTS, CLIENTS, EXPENSES, type Row } from "./store/schema";
import { SheetsBackend } from "./store/sheets-backend";

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  okToText: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  date: string;
  start: string;
  end: string;
  clientId: string;
  clientName: string;
  phone: string;
  service: string;
  price: number | null;
  tip: number | null;
  paymentMethod: string;
  status: AppointmentStatus;
  notes: string;
  calendarEventId: string;
  confirmationSentAt: string;
  reminderSentAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  date: string;
  item: string;
  category: string;
  amount: number | null;
  paymentMethod: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

let cached: TableBackend | null = null;

export function backend(): TableBackend {
  if (cached) return cached;
  if (isDemoMode()) {
    cached = new JsonBackend();
  } else {
    const id = config.spreadsheetId;
    if (!id) throw new Error("GOOGLE_SHEET_ID isn't set. See SETUP.md.");
    cached = new SheetsBackend(id);
  }
  return cached;
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

export function nowStamp(): string {
  return new Date().toISOString();
}

const str = (v: Row[string]) => (v === null || v === undefined ? "" : String(v));
const num = (v: Row[string]) => (typeof v === "number" ? v : null);

function toClient(r: Row): Client {
  return {
    id: str(r.id),
    name: str(r.name),
    phone: str(r.phone),
    email: str(r.email),
    okToText: r.okToText === true,
    notes: str(r.notes),
    createdAt: str(r.createdAt),
    updatedAt: str(r.updatedAt),
  };
}

function toAppointment(r: Row): Appointment {
  const status = str(r.status) as AppointmentStatus;
  return {
    id: str(r.id),
    date: str(r.date),
    start: str(r.start),
    end: str(r.end),
    clientId: str(r.clientId),
    clientName: str(r.clientName),
    phone: str(r.phone),
    service: str(r.service),
    price: num(r.price),
    tip: num(r.tip),
    paymentMethod: str(r.paymentMethod),
    status: ["Booked", "Paid", "Cancelled", "No-show"].includes(status) ? status : "Booked",
    notes: str(r.notes),
    calendarEventId: str(r.calendarEventId),
    confirmationSentAt: str(r.confirmationSentAt),
    reminderSentAt: str(r.reminderSentAt),
    createdAt: str(r.createdAt),
    updatedAt: str(r.updatedAt),
  };
}

function toExpense(r: Row): Expense {
  return {
    id: str(r.id),
    date: str(r.date),
    item: str(r.item),
    category: str(r.category),
    amount: num(r.amount),
    paymentMethod: str(r.paymentMethod),
    notes: str(r.notes),
    createdAt: str(r.createdAt),
    updatedAt: str(r.updatedAt),
  };
}

// Clients

export async function listClients(): Promise<Client[]> {
  const rows = await backend().readAll(CLIENTS);
  return rows.map(toClient).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getClient(id: string): Promise<Client | null> {
  return (await listClients()).find((c) => c.id === id) ?? null;
}

export async function insertClient(c: Client): Promise<void> {
  await backend().append(CLIENTS, { ...c });
}

export async function updateClient(c: Client): Promise<void> {
  const ok = await backend().update(CLIENTS, c.id, { ...c, updatedAt: nowStamp() });
  if (!ok) throw new Error("That client no longer exists in the sheet.");
}

// Appointments

export async function listAppointments(): Promise<Appointment[]> {
  const rows = await backend().readAll(APPOINTMENTS);
  return rows
    .map(toAppointment)
    .filter((a) => a.date)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  return (await listAppointments()).find((a) => a.id === id) ?? null;
}

export async function insertAppointment(a: Appointment): Promise<void> {
  await backend().append(APPOINTMENTS, { ...a });
}

export async function updateAppointment(a: Appointment): Promise<void> {
  const ok = await backend().update(APPOINTMENTS, a.id, { ...a, updatedAt: nowStamp() });
  if (!ok) throw new Error("That appointment no longer exists in the sheet.");
}

// Expenses

export async function listExpenses(): Promise<Expense[]> {
  const rows = await backend().readAll(EXPENSES);
  return rows
    .map(toExpense)
    .filter((e) => e.date)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function insertExpense(e: Expense): Promise<void> {
  await backend().append(EXPENSES, { ...e });
}

export async function deleteExpense(id: string): Promise<void> {
  await backend().remove(EXPENSES, id);
}
