// Shared by the proxy and server code, so no server-only / next/headers imports here.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "lma_session";
export const SESSION_DAYS = 30;

export interface SessionUser {
  email: string;
  name: string;
  picture?: string;
}

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET?.trim();
  if (s) return new TextEncoder().encode(s);
  if (process.env.DEMO_MODE === "true" && !process.env.VERCEL) {
    return new TextEncoder().encode("demo-mode-only-not-for-real-use-0123456789");
  }
  throw new Error("SESSION_SECRET isn't set. See SETUP.md.");
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, picture: user.picture })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.email)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return {
      email: payload.sub,
      name: typeof payload.name === "string" ? payload.name : payload.sub,
      picture: typeof payload.picture === "string" ? payload.picture : undefined,
    };
  } catch {
    return null;
  }
}
