import { SetupSheetButton } from "@/components/setup-sheet-button";
import { errorMessage } from "@/components/setup-needed";
import { requireUser } from "@/lib/auth";
import { config, isDemoMode } from "@/lib/config";
import { calendarApi, sheetsApi } from "@/lib/google";
import { SUMMARY_TAB } from "@/lib/sheet-setup";
import { smsConfigured } from "@/lib/sms";
import { DATA_TABS } from "@/lib/store/schema";
import { getTimeZone } from "@/lib/timezone";

interface Check {
  name: string;
  ok: boolean;
  detail: string;
}

async function runChecks(): Promise<Check[]> {
  if (isDemoMode()) {
    return [{ name: "Demo mode", ok: true, detail: "Data is saved on this computer in .data/demo.json. Nothing goes to Google or Twilio." }];
  }
  const checks: Check[] = [];
  try {
    if (!config.spreadsheetId) throw new Error("GOOGLE_SHEET_ID isn't set.");
    const res = await sheetsApi().spreadsheets.get({
      spreadsheetId: config.spreadsheetId,
      fields: "properties.title,sheets.properties.title",
    });
    const tabs = new Set(res.data.sheets?.map((s) => s.properties?.title));
    const missing = [SUMMARY_TAB, ...DATA_TABS.map((t) => t.name)].filter((t) => !tabs.has(t));
    checks.push({
      name: "Google Sheet",
      ok: missing.length === 0,
      detail: missing.length
        ? `Connected to “${res.data.properties?.title}”, but it needs setting up (missing ${missing.join(", ")}).`
        : `Connected to “${res.data.properties?.title}”.`,
    });
  } catch (err) {
    checks.push({ name: "Google Sheet", ok: false, detail: errorMessage(err) });
  }
  try {
    if (!config.calendarId) throw new Error("GOOGLE_CALENDAR_ID isn't set.");
    const res = await calendarApi().calendars.get({ calendarId: config.calendarId });
    checks.push({ name: "Google Calendar", ok: true, detail: `Connected to “${res.data.summary}”.` });
  } catch (err) {
    checks.push({ name: "Google Calendar", ok: false, detail: errorMessage(err) });
  }
  const live = config.smsMode === "live" && smsConfigured();
  checks.push({
    name: "Texting",
    ok: live,
    detail: live
      ? "Live: confirmations and day-before reminders go out through Twilio."
      : smsConfigured()
        ? "Twilio is configured but SMS_MODE isn't \"live\", so texts are only previewed."
        : "Off: Twilio isn't configured yet, so texts are only previewed.",
  });
  return checks;
}

export default async function SettingsPage() {
  const user = await requireUser();
  const [checks, tz] = await Promise.all([runChecks(), getTimeZone()]);
  return (
    <div className="space-y-6">
      <h1 className="heading text-2xl">Settings</h1>

      <section className="space-y-3">
        {checks.map((c) => (
          <div key={c.name} className="card flex gap-3">
            <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${c.ok ? "bg-emerald-400" : "bg-ember"}`} />
            <div>
              <div className="font-semibold text-white">{c.name}</div>
              <div className="text-sm text-muted">{c.detail}</div>
            </div>
          </div>
        ))}
        <div className="card text-sm text-muted">
          Time zone: <span className="text-silver">{tz}</span>
          {config.serviceAccountEmail && (
            <>
              <br />
              Share the sheet and calendar with: <span className="break-all text-silver">{config.serviceAccountEmail}</span>
            </>
          )}
        </div>
      </section>

      {!isDemoMode() && (
        <section className="space-y-2">
          <p className="text-sm text-muted">
            Creates the Summary, Appointments, Clients and Expenses tabs if they&apos;re missing. Safe to run again; it never
            deletes data.
          </p>
          <SetupSheetButton />
        </section>
      )}

      <section className="card space-y-3">
        <div className="text-sm text-muted">
          Signed in as <span className="text-silver">{user.email}</span>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="btn btn-ghost w-full">Sign out</button>
        </form>
      </section>

      <p className="text-center text-xs text-muted">
        On iPhone or iPad: open this site in Safari, tap Share, then “Add to Home Screen”.
      </p>
    </div>
  );
}
