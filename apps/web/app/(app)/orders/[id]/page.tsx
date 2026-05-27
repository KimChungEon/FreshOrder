"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import clsx from "clsx";
import { api } from "@freshorder/shared";
import type { Order, OrderStatus } from "@freshorder/shared";
import { PageHeader } from "../../../../components/PageHeader";
import { OrderStatusBadge } from "../../../../components/StatusBadge";
import {
  ErrorBlock,
  LoadingBlock,
} from "../../../../components/States";
import { formatKRW, formatDateTime } from "../../../../lib/format";
import { CheckIcon } from "../../../../components/icons";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "REQUESTED", label: "요청됨" },
  { key: "APPROVED",  label: "승인" },
  { key: "SHIPPING",  label: "배송중" },
  { key: "DELIVERED", label: "납품완료" },
];

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["order", params.id],
    queryFn: () => api.getOrderDetail(params.id),
  });

  if (isLoading) return <LoadingBlock />;
  if (isError || !data) {
    return (
      <div className="space-y-3">
        <ErrorBlock
          message={isError ? undefined : "발주를 찾을 수 없습니다."}
          onRetry={isError ? refetch : undefined}
        />
        <Link href="/orders" className="btn-ghost">← 목록으로</Link>
      </div>
    );
  }

  const rejected = data.status === "REJECTED";
  const stepIndex = rejected ? -1 : STEPS.findIndex((s) => s.key === data.status);
  const items = data.orderItems ?? [];
  const subtotal = items.reduce((s, it) => s + it.subtotal, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title={data.orderNumber}
        subtitle={`${data.store?.storeName ?? ""} · 요청 ${formatDateTime(data.requestedAt)}`}
        action={<OrderStatusBadge status={data.status} />}
      />

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold">진행 상태</h2>
        {rejected ? (
          <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
            반려된 발주입니다.
            {data.rejectReason && <p className="mt-1 text-xs">사유: {data.rejectReason}</p>}
          </div>
        ) : (
          <ol className="grid grid-cols-4 gap-2">
            {STEPS.map((s, i) => {
              const done = stepIndex >= 0 && i <= stepIndex;
              const current = i === stepIndex;
              return (
                <li key={s.key} className="flex flex-col items-center text-center">
                  <span
                    className={clsx(
                      "grid h-8 w-8 place-items-center rounded-full text-xs font-bold",
                      done ? "bg-primary text-white" : "bg-canvas text-ink-muted",
                      current && "ring-4 ring-primary/20",
                    )}
                  >
                    {done ? <CheckIcon width={16} height={16} /> : i + 1}
                  </span>
                  <span className={clsx("mt-2 text-[11px] font-medium", done ? "text-ink" : "text-ink-muted")}>
                    {s.label}
                  </span>
                  <span className="mt-0.5 text-[10px] text-ink-subtle">
                    {timestampFor(s.key, data)}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-line px-4 py-3 text-sm font-semibold">
          품목 ({items.length})
        </div>
        <table className="w-full text-sm">
          <thead className="bg-canvas text-xs text-ink-muted">
            <tr>
              <th className="px-4 py-2 text-left font-medium">품목</th>
              <th className="px-4 py-2 text-right font-medium">단가</th>
              <th className="px-4 py-2 text-right font-medium">수량</th>
              <th className="px-4 py-2 text-right font-medium">금액</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <div className="font-medium">{it.product?.name ?? "(품목 없음)"}</div>
                  <div className="text-xs text-ink-muted">{it.product?.unit}</div>
                </td>
                <td className="px-4 py-3 text-right">{formatKRW(it.unitPrice)}</td>
                <td className="px-4 py-3 text-right">{it.quantity}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatKRW(it.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-canvas">
            <tr className="border-t border-line">
              <td colSpan={3} className="px-4 py-2 text-right text-xs text-ink-muted">소계</td>
              <td className="px-4 py-2 text-right">{formatKRW(subtotal)}</td>
            </tr>
            <tr className="border-t border-line">
              <td colSpan={3} className="px-4 py-3 text-right font-semibold">합계</td>
              <td className="px-4 py-3 text-right text-base font-bold text-primary">
                {formatKRW(data.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <div className="flex justify-between">
        <Link href="/orders" className="btn-ghost">← 목록으로</Link>
      </div>
    </div>
  );
}

function timestampFor(step: OrderStatus, data: Order): string {
  if (step === "REQUESTED" && data.requestedAt) return formatDateTime(data.requestedAt);
  if (step === "APPROVED" && data.approvedAt) return formatDateTime(data.approvedAt);
  if (step === "DELIVERED" && data.deliveredAt) return formatDateTime(data.deliveredAt);
  return "";
}
