"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@freshorder/shared";
import { useAuth } from "../lib/store/auth";
import { BellIcon } from "./icons";

export function Header() {
  const user = useAuth((s) => s.user);
  const store = useAuth((s) => s.store);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => api.getNotifications(user!.id),
    enabled: !!user,
  });
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 md:max-w-5xl md:px-6">
        <div className="flex items-center gap-2">
          <div className="font-bold text-primary">FreshOrder</div>
          {store && (
            <span className="rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
              {store.name}
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
