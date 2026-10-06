import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { config, isDemoMode } from "./config";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession, type SessionUser } from "./session-token";

export function isAllowed(email: string): boolean {
  if (isDemoMode()) return true;
  return config.allowedEmails.includes(email.toLowerCase());
}

export async function startSession(user: SessionUser): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<SessionUser | null> {
  const user = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  // Re-check the allow list so removing an email takes effect immediately.
  return user && isAllowed(user.email) ? user : null;
}

/** Call at the top of every page and server action that touches Lisa's data. */
export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
