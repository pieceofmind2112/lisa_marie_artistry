"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  UserError,
  createBooking,
  recordPayment,
  resendConfirmation,
  setStatus,
  updateBooking,
  type BookingInput,
} from "@/lib/booking";
import { isDemoMode } from "@/lib/config";
import { isIsoDate } from "@/lib/dates";
import {
  deleteExpense,
  getClient,
  insertClient,
  insertExpense,
  newId,
  nowStamp,
  updateClient,
  type Client,
} from "@/lib/data";
import { setFlash } from "@/lib/flash";
import { toE164 } from "@/lib/phone";
import { setUpSheet } from "@/lib/sheet-setup";

export interface FormState {
  error?: string;
  messages?: string[];
}

function text(fd: FormData, name: string): string {
  const v = fd.get(name);
  return typeof v === "string" ? v.trim() : "";
}

function moneyField(fd: FormData, name: string, label: string): number | null {
  const raw = text(fd, name).replace(/[$,\s]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw new UserError(`${label} should be a dollar amount.`);
  return Math.round(n * 100) / 100;
}

function fail(err: unknown): FormState {
  // redirect() works by throwing; let it through.
  if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) {
    throw err;
  }
  if (err instanceof UserError) return { error: err.message };
  console.error(err);
  return { error: `Something went wrong: ${err instanceof Error ? err.message : String(err)}` };
}

function bookingFromForm(fd: FormData): BookingInput {
  const clientId = text(fd, "clientId");
  return {
    clientId: clientId || undefined,
    newClient: clientId
      ? undefined
      : { name: text(fd, "newClientName"), phone: text(fd, "newClientPhone"), okToText: fd.get("newClientOkToText") === "on" },
    date: text(fd, "date"),
    start: text(fd, "start"),
    durationMin: Number(text(fd, "duration")),
    service: text(fd, "service"),
    price: moneyField(fd, "price", "Value"),
    tip: moneyField(fd, "tip", "Tip"),
    paymentMethod: text(fd, "paymentMethod"),
    notes: text(fd, "notes"),
    sendText: fd.get("sendText") === "on",
  };
}

export async function saveAppointment(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  let id: string | undefined;
  try {
    const input = bookingFromForm(fd);
    const existingId = text(fd, "id");
    const outcome = existingId ? await updateBooking(existingId, input) : await createBooking(input);
    id = outcome.id;
    await setFlash([existingId ? "Appointment updated." : "Appointment booked.", ...outcome.notices]);
  } catch (err) {
    return fail(err);
  }
  revalidatePath("/", "layout");
  redirect(`/appointments/${id}`);
}

export async function savePayment(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const id = text(fd, "id");
  try {
    const outcome = await recordPayment(id, {
      price: moneyField(fd, "price", "Value"),
      tip: moneyField(fd, "tip", "Tip"),
      paymentMethod: text(fd, "paymentMethod"),
    });
    await setFlash(["Payment recorded.", ...outcome.notices]);
  } catch (err) {
    return fail(err);
  }
  revalidatePath("/", "layout");
  redirect(`/appointments/${id}`);
}

export async function changeStatus(id: string, status: "Cancelled" | "No-show" | "Booked"): Promise<FormState> {
  await requireUser();
  try {
    const outcome = await setStatus(id, status);
    const label = status === "Booked" ? "Appointment restored." : status === "Cancelled" ? "Appointment cancelled." : "Marked as a no-show.";
    await setFlash([label, ...outcome.notices]);
  } catch (err) {
    return fail(err);
  }
  revalidatePath("/", "layout");
  redirect(`/appointments/${id}`);
}

export async function resendText(id: string): Promise<FormState> {
  await requireUser();
  try {
    const outcome = await resendConfirmation(id);
    await setFlash(outcome.notices);
  } catch (err) {
    return fail(err);
  }
  revalidatePath("/", "layout");
  redirect(`/appointments/${id}`);
}

export async function saveClient(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  let id = text(fd, "id");
  try {
    const name = text(fd, "name");
    if (!name) throw new UserError("Enter the client's name.");
    const rawPhone = text(fd, "phone");
    const phone = rawPhone ? toE164(rawPhone) : "";
    if (rawPhone && !phone) throw new UserError("That phone number doesn't look right.");
    const fields = {
      name,
      phone: phone ?? "",
      email: text(fd, "email"),
      okToText: fd.get("okToText") === "on" && Boolean(phone),
      notes: text(fd, "notes"),
    };
    if (id) {
      const existing = await getClient(id);
      if (!existing) throw new UserError("That client no longer exists.");
      await updateClient({ ...existing, ...fields });
    } else {
      const client: Client = { id: newId("C"), ...fields, createdAt: nowStamp(), updatedAt: nowStamp() };
      await insertClient(client);
      id = client.id;
    }
    await setFlash(["Client saved."]);
  } catch (err) {
    return fail(err);
  }
  revalidatePath("/", "layout");
  redirect(`/clients/${id}`);
}

export async function addExpense(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  try {
    const date = text(fd, "date");
    if (!isIsoDate(date)) throw new UserError("Pick the date of the expense.");
    const item = text(fd, "item");
    if (!item) throw new UserError("What was it? Add an item or store name.");
    const amount = moneyField(fd, "amount", "Amount");
    if (amount === null) throw new UserError("Enter the amount.");
    await insertExpense({
      id: newId("E"),
      date,
      item,
      category: text(fd, "category") || "Other",
      amount,
      paymentMethod: text(fd, "paymentMethod"),
      notes: text(fd, "notes"),
      createdAt: nowStamp(),
      updatedAt: nowStamp(),
    });
  } catch (err) {
    return fail(err);
  }
  revalidatePath("/", "layout");
  return { messages: ["Expense saved."] };
}

export async function removeExpense(id: string): Promise<void> {
  await requireUser();
  await deleteExpense(id);
  revalidatePath("/", "layout");
}

export async function runSheetSetup(): Promise<FormState> {
  await requireUser();
  if (isDemoMode()) return { messages: ["Demo mode stores data locally, so there's no sheet to set up."] };
  try {
    return { messages: await setUpSheet(new Date().getFullYear()) };
  } catch (err) {
    return fail(err);
  }
}
