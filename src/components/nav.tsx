"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, MoneyIcon, PeopleIcon, PlusIcon } from "./icons";

const ITEMS = [
  { href: "/", label: "Schedule", Icon: CalendarIcon, match: (p: string) => p === "/" || p.startsWith("/appointments") },
  { href: "/book", label: "Book", Icon: PlusIcon, match: (p: string) => p.startsWith("/book") },
  { href: "/clients", label: "Clients", Icon: PeopleIcon, match: (p: string) => p.startsWith("/clients") },
  { href: "/money", label: "Money", Icon: MoneyIcon, match: (p: string) => p.startsWith("/money") },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-3xl grid-cols-4">
        {ITEMS.map(({ href, label, Icon, match }) => {
          const on = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold tracking-wide uppercase ${on ? "text-ember glow-text" : "text-muted"}`}
              >
                <Icon width={24} height={24} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
