import { OAuth2Client } from "google-auth-library";
import { isAllowed, startSession } from "@/lib/auth";
import { config } from "@/lib/config";

const client = new OAuth2Client();

/** Receives the ID token from the "Sign in with Google" button and starts a session. */
export async function POST(request: Request) {
  const clientId = config.googleClientId;
  if (!clientId) return Response.json({ error: "GOOGLE_CLIENT_ID isn't set." }, { status: 500 });

  const { credential } = (await request.json().catch(() => ({}))) as { credential?: string };
  if (!credential) return Response.json({ error: "Missing credential." }, { status: 400 });

  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    payload = ticket.getPayload();
  } catch {
    return Response.json({ error: "Google sign-in couldn't be verified. Try again." }, { status: 401 });
  }
  const email = payload?.email;
  if (!payload || !email || !payload.email_verified) {
    return Response.json({ error: "Your Google account email isn't verified." }, { status: 401 });
  }
  if (!isAllowed(email)) {
    return Response.json({ error: `${email} isn't allowed to use this app.` }, { status: 403 });
  }
  await startSession({ email, name: payload.given_name ?? payload.name ?? email, picture: payload.picture });
  return Response.json({ ok: true });
}
