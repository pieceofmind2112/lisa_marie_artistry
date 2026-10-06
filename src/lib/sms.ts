import "server-only";
import { config } from "./config";
import type { Appointment } from "./data";
import { formatDate, formatTime } from "./dates";
import { formatPhone } from "./phone";

export type SmsResult =
  | { status: "sent"; body: string }
  | { status: "preview"; body: string }
  | { status: "failed"; body: string; error: string };

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

function contactLine(): string {
  return config.businessPhone ? ` Questions or changes? Call/text Lisa at ${formatPhone(config.businessPhone)}.` : "";
}

export function confirmationText(a: Appointment): string {
  return (
    `Hi ${firstName(a.clientName)}! You're booked with ${config.businessName} on ` +
    `${formatDate(a.date, { weekday: "long" })} at ${formatTime(a.start)}.` +
    `${contactLine()} Reply STOP to opt out.`
  );
}

export function rescheduleText(a: Appointment): string {
  return (
    `Hi ${firstName(a.clientName)}, your ${config.businessName} appointment is now ` +
    `${formatDate(a.date, { weekday: "long" })} at ${formatTime(a.start)}.` +
    `${contactLine()} Reply STOP to opt out.`
  );
}

export function reminderText(a: Appointment): string {
  return (
    `Reminder: ${firstName(a.clientName)}, you're booked with ${config.businessName} tomorrow, ` +
    `${formatDate(a.date, { weekday: "long" })} at ${formatTime(a.start)}.` +
    `${contactLine()} Reply STOP to opt out.`
  );
}

export function smsConfigured(): boolean {
  return Boolean(
    config.twilioAccountSid && config.twilioAuthToken && (config.twilioFrom || config.twilioMessagingServiceSid),
  );
}

/**
 * Sends a text through Twilio. Until SMS_MODE=live (and Twilio is configured) messages are only
 * previewed, so the app can be tested without texting real clients.
 */
export async function sendSms(to: string, body: string): Promise<SmsResult> {
  if (config.smsMode !== "live" || !smsConfigured()) {
    console.info(`[sms preview] to ${to}: ${body}`);
    return { status: "preview", body };
  }
  const sid = config.twilioAccountSid!;
  const params = new URLSearchParams({ To: to, Body: body });
  if (config.twilioMessagingServiceSid) params.set("MessagingServiceSid", config.twilioMessagingServiceSid);
  else params.set("From", config.twilioFrom!);
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${config.twilioAuthToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    if (!res.ok) {
      const detail = (await res.json().catch(() => ({}))) as { message?: string };
      return { status: "failed", body, error: detail.message ?? `Twilio returned ${res.status}` };
    }
    return { status: "sent", body };
  } catch (err) {
    return { status: "failed", body, error: err instanceof Error ? err.message : String(err) };
  }
}
