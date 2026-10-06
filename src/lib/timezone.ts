import "server-only";
import { config, isDemoMode } from "./config";
import { calendarApi } from "./google";

const FALLBACK = "America/New_York";
let cached: string | null = null;

/** The business time zone: APP_TIMEZONE if set, otherwise whatever Lisa's Google Calendar uses. */
export async function getTimeZone(): Promise<string> {
  if (config.timeZoneOverride) return config.timeZoneOverride;
  if (cached) return cached;
  if (isDemoMode() || !config.calendarId) return FALLBACK;
  try {
    const res = await calendarApi().calendars.get({ calendarId: config.calendarId });
    cached = res.data.timeZone ?? FALLBACK;
  } catch {
    return FALLBACK;
  }
  return cached;
}
