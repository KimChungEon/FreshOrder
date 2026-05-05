import {
  HomeIcon,
  OrderIcon,
  InventoryIcon,
  BoardIcon,
  SettingsIcon,
} from "./icons";

export interface NavItem {
  href: string;
  label: string;
  Icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
  match: (pathname: string) => boolean;
}

export const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "홈",
    Icon: HomeIcon,
    match: (p) => p === "/dashboard",
  },
  {
    href: "/orders",
    label: "발주",
    Icon: OrderIcon,
    match: (p) => p.startsWith("/orders"),
  },
  {
    href: "/inventory",
    label: "재고",
    Icon: InventoryIcon,
    match: (p) => p.startsWith("/inventory"),
  },
  {
    href: "/board",
    label: "게시판",
    Icon: BoardIcon,
    match: (p) => p.startsWith("/board"),
  },
  {
    href: "/settings",
    label: "설정",
    Icon: SettingsIcon,
    match: (p) => p.startsWith("/settings"),
  },
];
