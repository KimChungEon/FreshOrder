import { NavLink } from "react-router-dom";
import clsx from "clsx";
import {
  HomeIcon,
  OrderIcon,
  PackageIcon,
  StoreIcon,
  CardIcon,
  BoardIcon,
  SettingsIcon,
} from "./icons";
import { Logo } from "./Logo";

const NAV = [
  { to: "/dashboard",    label: "대시보드",   Icon: HomeIcon },
  { to: "/orders",       label: "발주 관리",  Icon: OrderIcon },
  { to: "/products",     label: "품목 관리",  Icon: PackageIcon },
  { to: "/stores",       label: "점포 관리",  Icon: StoreIcon },
  { to: "/settlements",  label: "정산 관리",  Icon: CardIcon },
  { to: "/board",        label: "게시판 관리", Icon: BoardIcon },
  { to: "/settings",     label: "설정",       Icon: SettingsIcon },
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-line bg-white">
      <div className="px-6 py-6">
        <Logo variant="horizontal" className="h-9 w-auto" />
        <div className="mt-2 text-xs text-ink-muted">본사 관리자</div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-ink-muted hover:bg-canvas hover:text-ink",
              )
            }
          >
            <Icon width={18} height={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-5 text-[11px] text-ink-subtle">
        © 2026 FreshOrder
      </div>
    </aside>
  );
}
