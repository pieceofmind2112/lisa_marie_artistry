// The Google Sheet is the database. Each tab is a table whose first row holds these headers.
// Columns are matched by header text, so Lisa can add her own columns to the right safely.

export type ColumnKind = "text" | "number" | "date" | "time" | "bool";
export type Cell = string | number | boolean | null;
export type Row = Record<string, Cell>;

export interface ColumnDef {
  key: string;
  header: string;
  kind: ColumnKind;
  /** Pixel width used when the app sets up the sheet. */
  width?: number;
  /** Hidden in the sheet (internal bookkeeping). */
  hidden?: boolean;
}

export interface TabDef {
  name: string;
  columns: ColumnDef[];
}

export const CLIENTS: TabDef = {
  name: "Clients",
  columns: [
    { key: "id", header: "Client ID", kind: "text", width: 110, hidden: true },
    { key: "name", header: "Name", kind: "text", width: 180 },
    { key: "phone", header: "Phone", kind: "text", width: 130 },
    { key: "email", header: "Email", kind: "text", width: 200 },
    { key: "okToText", header: "OK to Text", kind: "bool", width: 90 },
    { key: "notes", header: "Notes / Color Formulas", kind: "text", width: 360 },
    { key: "createdAt", header: "Created", kind: "text", width: 160, hidden: true },
    { key: "updatedAt", header: "Updated", kind: "text", width: 160, hidden: true },
  ],
};

// Column letters for this tab are referenced by the Summary formulas (see sheet-setup.ts).
export const APPOINTMENTS: TabDef = {
  name: "Appointments",
  columns: [
    { key: "id", header: "Appt ID", kind: "text", width: 110, hidden: true }, // A
    { key: "date", header: "Date", kind: "date", width: 120 }, // B
    { key: "start", header: "Start", kind: "time", width: 80 }, // C
    { key: "end", header: "End", kind: "time", width: 80 }, // D
    { key: "clientName", header: "Client", kind: "text", width: 170 }, // E
    { key: "phone", header: "Phone", kind: "text", width: 130 }, // F
    { key: "service", header: "Service", kind: "text", width: 170 }, // G
    { key: "price", header: "Value", kind: "number", width: 90 }, // H
    { key: "tip", header: "Tip", kind: "number", width: 70 }, // I
    { key: "paymentMethod", header: "Payment Method", kind: "text", width: 130 }, // J
    { key: "status", header: "Status", kind: "text", width: 100 }, // K
    { key: "notes", header: "Notes", kind: "text", width: 300 }, // L
    { key: "clientId", header: "Client ID", kind: "text", width: 110, hidden: true }, // M
    { key: "calendarEventId", header: "Calendar Event ID", kind: "text", width: 120, hidden: true }, // N
    { key: "confirmationSentAt", header: "Confirmation Sent", kind: "text", width: 160, hidden: true }, // O
    { key: "reminderSentAt", header: "Reminder Sent", kind: "text", width: 160, hidden: true }, // P
    { key: "createdAt", header: "Created", kind: "text", width: 160, hidden: true }, // Q
    { key: "updatedAt", header: "Updated", kind: "text", width: 160, hidden: true }, // R
  ],
};

export const EXPENSES: TabDef = {
  name: "Expenses",
  columns: [
    { key: "id", header: "Expense ID", kind: "text", width: 110, hidden: true }, // A
    { key: "date", header: "Date", kind: "date", width: 120 }, // B
    { key: "item", header: "Item / Vendor", kind: "text", width: 200 }, // C
    { key: "category", header: "Category", kind: "text", width: 190 }, // D
    { key: "amount", header: "Amount", kind: "number", width: 100 }, // E
    { key: "paymentMethod", header: "Paid With", kind: "text", width: 120 }, // F
    { key: "notes", header: "Notes", kind: "text", width: 300 }, // G
    { key: "createdAt", header: "Created", kind: "text", width: 160, hidden: true }, // H
    { key: "updatedAt", header: "Updated", kind: "text", width: 160, hidden: true }, // I
  ],
};

export const DATA_TABS = [APPOINTMENTS, CLIENTS, EXPENSES];

export function columnLetter(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function columnOf(tab: TabDef, key: string): string {
  const i = tab.columns.findIndex((c) => c.key === key);
  if (i < 0) throw new Error(`No column ${key} in ${tab.name}`);
  return columnLetter(i);
}
