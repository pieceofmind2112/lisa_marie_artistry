import { startSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/config";

export async function POST() {
  if (!isDemoMode()) return Response.json({ error: "Demo mode is off." }, { status: 404 });
  await startSession({ email: "demo@localhost", name: "Demo" });
  return Response.json({ ok: true });
}
