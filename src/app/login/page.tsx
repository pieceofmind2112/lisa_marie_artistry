import Image from "next/image";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { config, isDemoMode } from "@/lib/config";
import { LoginPanel } from "./login-panel";

export default async function LoginPage() {
  if (await currentUser()) redirect("/");
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-10 px-6 py-12">
      <Image
        src="/brand/logo.jpg"
        alt="LisaMarie Artistry"
        width={1600}
        height={900}
        priority
        className="w-full max-w-md"
      />
      <LoginPanel clientId={config.googleClientId ?? null} demo={isDemoMode()} />
    </main>
  );
}
