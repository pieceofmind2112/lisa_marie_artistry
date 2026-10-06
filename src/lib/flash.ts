import "server-only";
import { cookies } from "next/headers";

export const FLASH_COOKIE = "lma_flash";

/** One-time messages shown after a redirect (read and cleared by <Flash /> in the browser). */
export async function setFlash(messages: string[]): Promise<void> {
  if (!messages.length) return;
  (await cookies()).set(FLASH_COOKIE, JSON.stringify({ at: Date.now(), messages }), {
    path: "/",
    maxAge: 60,
    sameSite: "lax",
  });
}
