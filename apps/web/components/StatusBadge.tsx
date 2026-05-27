import clsx from "clsx";
import {
  Clock,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  Banknote,
  Megaphone,
  HelpCircle,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import type { BoardType, InventoryStatus, OrderStatus } from "@freshorder/shared";

type Tone = {
  label: string;
  cls: string;
  Icon: LucideIcon;
};

const orderMap: Record<OrderStatus, Tone> = {
  REQUESTED: { label: "요청됨",   cls: "bg-warning-50 text-warning-700",  Icon: Clock },
  ACCEPTED:  { label: "접수",     cls: "bg-info-50 text-info-700",        Icon: ClipboardCheck },
  APPROVED:  { label: "승인",     cls: "bg-primary-50 text-primary-700",  Icon: CheckCircle2 },
  REJECTED:  { label: "반려",     cls: "bg-danger-50 text-danger-700",    Icon: XCircle },
  SHIPPING:  { label: "배송중",   cls: "bg-info-50 text-info-700",        Icon: Truck },
  DELIVERED: { label: "납품완료", cls: "bg-success-50 text-success-700",  Icon: PackageCheck },
  SETTLED:   { label: "정산완료", cls: "bg-success-100 text-success-800", Icon: Banknote },
};

const invMap: Record<InventoryStatus, Tone> = {
  EMPTY:      { label: "품절", cls: "bg-danger-100 text-danger-800",   Icon: XCircle },
  SHORTAGE:   { label: "부족", cls: "bg-danger-50 text-danger-700",    Icon: XCircle },
  WARNING:    { label: "주의", cls: "bg-warning-50 text-warning-700",  Icon: Clock },
  SUFFICIENT: { label: "충분", cls: "bg-success-50 text-success-700",  Icon: CheckCircle2 },
};

const postMap: Record<BoardType, Tone> = {
  NOTICE:     { label: "공지", cls: "bg-primary-50 text-primary-700", Icon: Megaphone },
  QNA:        { label: "Q&A",  cls: "bg-info-50 text-info-700",       Icon: HelpCircle },
  SUGGESTION: { label: "건의", cls: "bg-warning-50 text-warning-700", Icon: Lightbulb },
};

function Chip({ tone, className }: { tone: Tone; className?: string }) {
  const { label, cls, Icon } = tone;
  return (
    <span className={clsx("chip inline-flex items-center gap-1", cls, className)}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      {label}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Chip tone={orderMap[status]} />;
}

export function InventoryStatusBadge({ status }: { status: InventoryStatus }) {
  return <Chip tone={invMap[status]} />;
}

export function PostTypeBadge({ type }: { type: BoardType }) {
  return <Chip tone={postMap[type]} />;
}
