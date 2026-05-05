"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV } from "./nav";

export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="주요 메뉴"
    >
      <ul className="grid grid-cols-5">
        {NAV.map(({ href, label, Icon, match }) => {
          const active = match(pathname ?? "");
          return (
            <li key={href}>
              <Link
                href={href}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition",
                  active ? "text-primary" : "text-ink-muted",
                )}
              >
                <Icon width={22} height={22} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
