import { sendDueReminders } from "@/lib/booking";
import { config } from "@/lib/config";

// Vercel Cron calls this once a day (see vercel.json) with "Authorization: Bearer $CRON_SECRET".
export async function GET(request: Request) {
  const secret = config.cronSecret;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return Response.json(await sendDueReminders());
  } catch (err) {
    console.error(err);
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
