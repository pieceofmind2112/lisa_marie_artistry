import { endSession } from "@/lib/auth";

export async function POST(request: Request) {
  await endSession();
  return Response.redirect(new URL("/login", request.url), 303);
}
