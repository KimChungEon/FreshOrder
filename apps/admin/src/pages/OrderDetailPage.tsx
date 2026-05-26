import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { api } from "@freshorder/shared";
import type { Order, OrderStatus } from "@freshorder/shared";
import { PageHeader } from "../components/PageHeader";
import { OrderStatusBadge } from "../components/StatusBadge";
import { ErrorBlock, LoadingBlock } from "../components/States";
import { formatKRW, formatDateTime } from "../lib/format";
import { CheckIcon, XIcon } from "../components/icons";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "REQUESTED", label: "요청됨" },
  { key: "APPROVED",  label: "승인" },
  { key: "SHIPPING",  label: "배송중" },
  { key: "DELIVERED", label: "납품완료" },
];

export default function OrderDetailPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api.getOrderDetail(id),
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["order", id] });
    qc.invalidateQueries({ queryKey: ["orders"] });
    qc.invalidateQueries({ queryKey: ["dashboard", "admin"] });
  };

  const approve = useMutation({ mutationFn: () => api.approveOrder(id), onSuccess: invalidate });
  const ship = useMutation({ mutationFn: () => api.shipOrder(id), onSuccess: invalidate });
  const deliver = useMutation({ mutationFn: () => api.deliverOrder(id), onSuccess: invalidate });
  const reject = useMutation({
    mutationFn: () => api.rejectOrder(id, reason.trim()),
    onSuccess: () => { setRejectOpen(false); setReason(""); invalidate(); },
  });

  if (isLoading) return <LoadingBlock />;
  if (isError || !data) {
    return (
      <div className="space-y-3">
        <ErrorBlock
          message={isError ? undefined : "발주를 찾을 수 없습니다."}
          onRetry={isError ? refetch : undefined}
        />
        <Link to="/orders" className="btn-ghost">← 목록</Link>
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
          <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-800">
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
                  <span className={clsx(
                    "grid h-9 w-9 place-items-center rounded-full text-xs font-bold",
                    done ? "bg-primary text-white" : "bg-canvas text-ink-muted",
                    current && "ring-4 ring-primary/20",
                  )}>
                    {done ? <CheckIcon width={16} height={16} /> : i + 1}
                  </span>
                  <span className={clsx("mt-2 text-xs font-medium", done ? "text-ink" : "text-ink-muted")}>{s.label}</span>
                  <span className="mt-0.5 text-[10px] text-ink-subtle">{timestampFor(s.key, data)}</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-line px-5 py-3 text-sm font-semibold">품목 ({items.length})</div>
        <table className="w-full">
          <thead className="bg-canvas">
            <tr>
              <th className="th">품목</th>
              <th className="th text-right">단가</th>
              <th className="th text-right">수량</th>
              <th className="th text-right">금액</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-line">
                <td className="td">
                  <div className="font-medium">{it.product?.name ?? "(품목 없음)"}</div>
                  <div className="text-xs text-ink-muted">{it.product?.unit}</div>
                </td>
                <td className="td text-right">{formatKRW(it.unitPrice)}</td>
                <td className="td text-right">{it.quantity}</td>
                <td className="td text-right font-semibold">{formatKRW(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-canvas">
            <tr className="border-t border-line">
              <td colSpan={3} className="td text-right text-xs text-ink-muted">소계</td>
              <td className="td text-right">{formatKRW(subtotal)}</td>
            </tr>
            <tr className="border-t border-line">
              <td colSpan={3} className="td text-right font-semibold">합계</td>
              <td className="td text-right text-base font-bold text-primary">{formatKRW(data.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/orders" className="btn-ghost">← 목록</Link>
        <div className="flex flex-wrap gap-2">
          {data.status === "REQUESTED" && (
            <>
              <button disabled={approve.isPending} onClick={() => approve.mutate()} className="btn-primary">
                <CheckIcon width={16} height={16} className="mr-1" /> 승인
              </button>
              <button disabled={reject.isPending} onClick={() => setRejectOpen(true)} className="btn-ghost text-rose-600">
                <XIcon width={16} height={16} className="mr-1" /> 반려
              </button>
            </>
          )}
          {data.status === "APPROVED" && (
            <button disabled={ship.isPending} onClick={() => ship.mutate()} className="btn-primary">배송 시작</button>
          )}
          {data.status === "SHIPPING" && (
            <button disabled={deliver.isPending} onClick={() => deliver.mutate()} className="btn-primary">납품 완료 처리</button>
          )}
        </div>
      </section>

      {rejectOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="card w-full max-w-sm space-y-3 p-5">
            <h3 className="text-sm font-semibold">반려 사유</h3>
            <textarea className="input resize-none" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="점주에게 표시할 반려 사유" />
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => { setRejectOpen(false); setReason(""); }}>취소</button>
              <button className="btn-danger" disabled={!reason.trim() || reject.isPending} onClick={() => reject.mutate()}>반려 처리</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function timestampFor(step: OrderStatus, data: Order): string {
  if (step === "REQUESTED" && data.requestedAt) return formatDateTime(data.requestedAt);
  if (step === "APPROVED" && data.approvedAt) return formatDateTime(data.approvedAt);
  if (step === "DELIVERED" && data.deliveredAt) return formatDateTime(data.deliveredAt);
  return "";
}
