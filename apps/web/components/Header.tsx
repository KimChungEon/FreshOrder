"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@freshorder/shared";
import { useAuth } from "../lib/store/auth";
import { BellIcon } from "./icons";
import { Logo } from "./Logo";

export function Header() {
  const user = useAuth((s) => s.user);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => api.getNotifications(),
    enabled: !!user,
  });
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 md:max-w-5xl md:px-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" aria-label="홈" className="flex items-center">
            <Logo variant="horizontal" className="h-7 w-auto" />
          </Link>
          {user && (
            <span className="rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
              {user.name || user.email}
            </span>
          )}
        </div>
        <Link
          href="/dashboard"
          aria-label="알림"
          className="relative rounded-full p-2 text-ink-muted hover:bg-canvas hover:text-ink"
        >
          <BellIcon />
          {unread > 0 && (
            <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
