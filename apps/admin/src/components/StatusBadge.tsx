import clsx from "clsx";
import type { OrderStatus, PostType } from "@freshorder/shared";

const orderMap: Record<OrderStatus, { label: string; cls: string }> = {
  requested: { label: "요청됨",   cls: "bg-amber-100 text-amber-800" },
  approved:  { label: "승인",     cls: "bg-blue-100 text-blue-800" },
  shipping:  { label: "배송중",   cls: "bg-violet-100 text-violet-800" },
  delivered: { label: "납품완료", cls: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "취소",     cls: "bg-gray-100 text-gray-700" },
};

const postMap: Record<PostType, { label: string; cls: string }> = {
  notice:     { label: "공지", cls: "bg-primary-50 text-primary-700" },
  qna:        { label: "Q&A",  cls: "bg-blue-100 text-blue-800" },
  suggestion: { label: "건의", cls: "bg-violet-100 text-violet-800" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const m = orderMap[status];
  return <span className={clsx("chip", m.cls)}>{m.label}</span>;
}

export function PostTypeBadge({ type }: { type: PostType }) {
  const m = postMap[type];
  return <span className={clsx("chip", m.cls)}>{m.label}</span>;
}

export function PaidBadge({ outstanding }: { outstanding: number }) {
  if (outstanding <= 0)
    return (
      <span className="chip bg-emerald-100 text-emerald-800">정산완료</span>
    );
  return <span className="chip bg-rose-100 text-rose-800">미수금</span>;
}
