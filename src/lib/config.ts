import "server-only";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

/** Demo mode keeps data in a local JSON file and skips Google/Twilio. Local use only. */
export function isDemoMode(): boolean {
  return env("DEMO_MODE") === "true" && !process.env.VERCEL;
}

export const config = {
  get googleClientId() {
    return env("GOOGLE_CLIENT_ID");
  },
  get allowedEmails(): string[] {
    return (env("ALLOWED_EMAILS") ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  },
  get sessionSecret() {
    return env("SESSION_SECRET");
  },
  get serviceAccountEmail() {
    return env("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  },
  get serviceAccountKey() {
    // Vercel and .env files store the key with literal "\n" sequences.
    return env("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")?.replace(/\\n/g, "\n");
  },
  get spreadsheetId() {
    return env("GOOGLE_SHEET_ID");
  },
  get calendarId() {
    return env("GOOGLE_CALENDAR_ID");
  },
  get timeZoneOverride() {
    return env("APP_TIMEZONE");
  },
  get twilioAccountSid() {
    return env("TWILIO_ACCOUNT_SID");
  },
  get twilioAuthToken() {
    return env("TWILIO_AUTH_TOKEN");
  },
  get twilioFrom() {
    return env("TWILIO_FROM_NUMBER");
  },
  get twilioMessagingServiceSid() {
    return env("TWILIO_MESSAGING_SERVICE_SID");
  },
  /** "live" sends real texts; anything else only previews them. */
  get smsMode(): "live" | "preview" {
    return env("SMS_MODE") === "live" ? "live" : "preview";
  },
  get businessName() {
    return env("BUSINESS_NAME") ?? "LisaMarie Artistry";
  },
  get businessPhone() {
    return env("BUSINESS_PHONE");
  },
  get cronSecret() {
    return env("CRON_SECRET");
  },
};
