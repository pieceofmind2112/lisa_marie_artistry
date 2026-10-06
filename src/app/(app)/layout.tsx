import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { Flash } from "@/components/flash";
import { GearIcon } from "@/components/icons";
import { BottomNav } from "@/components/nav";
import { requireUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/config";
import { FLASH_COOKIE } from "@/lib/flash";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireUser();
  const flash = (await cookies()).get(FLASH_COOKIE)?.value ?? "";
  return (
    <div className="min-h-dvh pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 border-b border-line bg-ink/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/brand/icon-192.png" alt="" width={40} height={40} className="rounded-lg" />
            <span className="leading-tight">
              <span className="heading glow-text block text-lg">LisaMarie</span>
              <span className="font-script -mt-1 block text-sm text-silver">Artistry</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {isDemoMode() && (
              <span className="rounded-full border border-ember/50 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-ember uppercase">
                Demo
              </span>
            )}
            <Link href="/settings" aria-label="Settings" className="p-1.5 text-muted hover:text-silver">
              <GearIcon />
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pt-4">
        {flash && <Flash key={flash} raw={flash} />}
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
