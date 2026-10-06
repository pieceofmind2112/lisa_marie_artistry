// Dates are plain "YYYY-MM-DD" strings and times are "HH:mm" (24h) strings in the
// business's local time zone. Treating them as wall-clock values avoids any UTC drift.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^\d{2}:\d{2}$/;

export function isIsoDate(s: string): boolean {
  return ISO_DATE.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));
}

export function isHHMM(s: string): boolean {
  if (!HHMM.test(s)) return false;
  const [h, m] = s.split(":").map(Number);
  return h < 24 && m < 60;
}

export function todayIso(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toUtcDate(iso: string): Date {
  return new Date(iso + "T00:00:00Z");
}

export function addDays(iso: string, days: number): string {
  const d = toUtcDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

/** "Tue, Oct 7" (or with year when asked). */
export function formatDate(iso: string, opts: { year?: boolean; weekday?: "short" | "long" } = {}): string {
  return toUtcDate(iso).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: opts.weekday ?? "short",
    month: "short",
    day: "numeric",
    ...(opts.year ? { year: "numeric" } : {}),
  });
}

/** "2:30 PM" */
export function formatTime(hhmm: string): string {
  if (!isHHMM(hhmm)) return hhmm;
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

// Google Sheets serial dates: days since 1899-12-30, with the time of day as the fraction.
const SHEETS_EPOCH_MS = Date.UTC(1899, 11, 30);
const DAY_MS = 86_400_000;

export function serialToIsoDate(serial: number): string {
  return new Date(SHEETS_EPOCH_MS + Math.floor(serial) * DAY_MS).toISOString().slice(0, 10);
}

export function serialToHHMM(serial: number): string {
  const minutes = Math.round((serial - Math.floor(serial)) * 24 * 60) % (24 * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Best effort for dates someone typed by hand into the sheet ("10/7/2026", "2026-10-07"). */
export function parseLooseDate(value: string): string | null {
  const s = value.trim();
  if (isIsoDate(s)) return s;
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (us) {
    const year = us[3].length === 2 ? 2000 + Number(us[3]) : Number(us[3]);
    const iso = `${year}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
    return isIsoDate(iso) ? iso : null;
  }
  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return null;
}

/** Best effort for times typed by hand ("2:30 PM", "14:30", "2:30:00 PM"). */
export function parseLooseTime(value: string): string | null {
  const m = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (m[3]) {
    const pm = m[3].toLowerCase() === "pm";
    if (h === 12) h = pm ? 12 : 0;
    else if (pm) h += 12;
  }
  const out = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  return isHHMM(out) ? out : null;
}

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
