import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const ic = (path: React.ReactNode) => (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    {path}
  </svg>
);

export const HomeIcon = ic(
  <>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </>,
);
export const OrderIcon = ic(
  <>
    <path d="M6 3h12l1 4H5l1-4Z" />
    <path d="M5 7v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7" />
    <path d="M9 11h6" />
  </>,
);
export const InventoryIcon = ic(
  <>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M3 11h18" />
    <path d="M8 7V4h8v3" />
  </>,
);
export const BoardIcon = ic(
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 9h10M7 13h10M7 17h6" />
  </>,
);
export const SettingsIcon = ic(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.6l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </>,
);
export const BellIcon = ic(
  <>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </>,
);
export const SearchIcon = ic(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>,
);
export const PlusIcon = ic(<path d="M12 5v14M5 12h14" />);
export const MinusIcon = ic(<path d="M5 12h14" />);
export const StarIcon = ic(
  <path d="M12 2.5l3 6.4 7 .9-5.2 4.7 1.5 6.9L12 17.9l-6.3 3.5 1.5-6.9L2 9.8l7-.9 3-6.4Z" />,
);
export const ChevronRightIcon = ic(<path d="m9 6 6 6-6 6" />);
export const ChevronLeftIcon = ic(<path d="m15 6-6 6 6 6" />);
export const CheckIcon = ic(<path d="m5 12 5 5 9-11" />);
export const AlertIcon = ic(
  <>
    <path d="M12 2 1 21h22L12 2Z" />
    <path d="M12 9v6M12 18v.01" />
  </>,
);
export const PackageIcon = ic(
  <>
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
    <path d="M21 16.5v-9a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 7.5v9a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7Z" />
  </>,
);
export const TruckIcon = ic(
  <>
    <path d="M14 18V6h6l3 5v7h-3" />
    <path d="M3 18V6h11v12H8" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
  </>,
);
export const ClipboardIcon = ic(
  <>
    <rect x="8" y="4" width="8" height="3" rx="1" />
    <path d="M16 5h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
  </>,
);
export const PinIcon = ic(
  <>
    <path d="m12 17-5 5v-7" />
    <path d="m9 12 6-6 4 4-6 6-4-4Z" />
  </>,
);
export const CardIcon = ic(
  <>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </>,
);
