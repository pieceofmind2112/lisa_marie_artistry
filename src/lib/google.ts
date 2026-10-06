import "server-only";
import { JWT } from "google-auth-library";
import { sheets, type sheets_v4 } from "@googleapis/sheets";
import { calendar, type calendar_v3 } from "@googleapis/calendar";
import { config } from "./config";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

let jwt: JWT | null = null;

/**
 * The app talks to Google as a service account (a robot user). Lisa shares her sheet and
 * calendar with its email address, so no personal Google tokens are ever stored.
 */
function serviceAccount(): JWT {
  if (jwt) return jwt;
  const email = config.serviceAccountEmail;
  const key = config.serviceAccountKey;
  if (!email || !key) {
    throw new Error(
      "Google service account isn't configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.",
    );
  }
  jwt = new JWT({ email, key, scopes: SCOPES });
  return jwt;
}

export function sheetsApi(): sheets_v4.Sheets {
  return sheets({ version: "v4", auth: serviceAccount() });
}

export function calendarApi(): calendar_v3.Calendar {
  return calendar({ version: "v3", auth: serviceAccount() });
}
