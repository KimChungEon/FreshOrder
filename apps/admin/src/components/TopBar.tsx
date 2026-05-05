import { useQuery } from "@tanstack/react-query";
import { api } from "@freshorder/shared";
import { useAuth } from "../lib/store/auth";
import { BellIcon } from "./icons";

export function TopBar() {
  const user = useAuth((s) => s.user);
  const { data: notifications = [] } = useQuery({
    queryKey: ["admin-notifications", user?.id],
    queryFn: () => api.getNotifications(user!.id),
    enabled: !!user,
  });
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white/90 px-6 backdrop-blur">
      <div className="text-sm text-ink-muted">관리자 콘솔</div>
      <div className="flex items-center gap-4">
        <button
          aria-label="알림"
          className="relative rounded-full p-2 text-ink-muted hover:bg-canvas hover:text-ink"
        >
          <BellIcon />
          {unread > 0 && (
            <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-white">
            {user?.name?.slice(0, 1) ?? "A"}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold leading-none">
              {user?.name ?? "관리자"}
            </p>
            <p className="text-[11px] text-ink-muted">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
