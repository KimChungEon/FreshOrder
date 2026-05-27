"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV } from "./nav";
import { useAuth } from "../lib/store/auth";
import { Logo } from "./Logo";

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-line md:bg-white">
      <div className="px-6 py-6">
        <Logo variant="horizontal" className="h-9 w-auto" />
        {user && <div className="mt-2 text-xs text-ink-muted">{user.email}</div>}
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, Icon, match }) => {
          const active = match(pathname ?? "");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                active
                  ? "bg-primary-50 text-primary-700"
                  : "text-ink-muted hover:bg-canvas hover:text-ink",
              )}
            >
              <Icon width={20} height={20} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line p-4">
        {user && (
          <div className="mb-2 text-xs">
            <div className="font-medium text-ink">{user.name}</div>
            <div className="text-ink-muted">{user.email}</div>
          </div>
        )}
        <button onClick={logout} className="btn-ghost w-full">
          로그아웃
        </button>
      </div>
    </aside>
  );
}
