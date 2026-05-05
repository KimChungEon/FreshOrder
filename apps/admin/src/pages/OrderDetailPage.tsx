import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { api } from "@freshorder/shared";
import type { OrderStatus } from "@freshorder/shared";
import { PageHeader } from "../components/PageHeader";
import { OrderStatusBadge } from "../components/StatusBadge";
import { ErrorBlock, LoadingBlock } from "../components/States";
import { formatKRW, formatDateTime } from "../lib/format";
import { CheckIcon, XIcon } from "../components/icons";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "requested", label: "요청됨" },
  { key: "approved",  label: "승인" },
  { key: "shipping",  label: "배송중" },
  { key: "delivered", label: "납품완료" },
];

export default function OrderDetailPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api.getOrder(id),
    enabled: !!id,
  });

  const updateStatus = useMutation({
    mutationFn: (status: OrderStatus) => api.updateOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  if (isLoading) return <LoadingBlock />;
  if (isError || !data) {
    return (
      <div className="space-y-3">
        <ErrorBlock
          message={isError ? undefined : "발주를 찾을 수 없습니다."}
          onRetry={isError ? refetch : undefined}
        />
        <Link to="/orders" className="btn-ghost">
          ← 목록
        </Link>
      </div>
    );
  }

  const cancelled = data.status === "cancelled";
  const stepIndex = cancelled
    ? -1
    : STEPS.findIndex((s) => s.key === data.status);

  return (
    <div className="space-y-5">
      <PageHeader
        title={data.orderNo}
        subtitle={`${data.storeName} · 요청 ${formatDateTime(data.requestedAt)}`}
        action={<OrderStatusBadge status={data.status} />}
      />

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold">진행 상태</h2>
        {cancelled ? (
          <div className="rounded-lg bg-gray-100 p-4 text-sm text-gray-700">
            취소된 발주입니다.{" "}
            {data.cancelledAt && `(${formatDateTime(data.cancelledAt)})`}
            {data.memo && <p className="mt-1 text-xs">사유: {data.memo}</p>}
          </div>
        ) : (
          <ol className="grid grid-cols-4 gap-2">
            {STEPS.map((s, i) => {
              const done = i <= stepIndex;
              const current = i === stepIndex;
              return (
                <li
                  key={s.key}
                  className="flex flex-col items-center text-center"
                >
                  <span
                    className={clsx(
                      "grid h-9 w-9 place-items-center rounded-full text-xs font-bold",
                      done
                        ? "bg-primary text-white"
                        : "bg-canvas text-ink-muted",
                      current && "ring-4 ring-primary/20",
                    )}
                  >
                    {done ? <CheckIcon width={16} height={16} /> : i + 1}
                  </span>
                  <span
                    className={clsx(
                      "mt-2 text-xs font-medium",
                      done ? "text-ink" : "text-ink-muted",
                    )}
                  >
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
        <div className="border-b border-line px-5 py-3 text-sm font-semibold">
          품목 ({data.items.length})
        </div>
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
            {data.items.map((it) => (
              <tr key={it.productId} className="border-t border-line">
                <td className="td">
                  <div className="font-medium">{it.productName}</div>
                  <div className="text-xs text-ink-muted">{it.unit}</div>
                </td>
                <td className="td text-right">{formatKRW(it.unitPrice)}</td>
                <td className="td text-right">{it.qty}</td>
                <td className="td text-right font-semibold">
                  {formatKRW(it.amount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-canvas">
            <tr className="border-t border-line">
              <td colSpan={3} className="td text-right text-xs text-ink-muted">
                소계
              </td>
              <td className="td text-right">{formatKRW(data.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="td text-right text-xs text-ink-muted">
                배송비
              </td>
              <td className="td text-right">{formatKRW(data.deliveryFee)}</td>
            </tr>
            <tr className="border-t border-line">
              <td colSpan={3} className="td text-right font-semibold">
                합계
              </td>
              <td className="td text-right text-base font-bold text-primary">
                {formatKRW(data.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      {(data.memo || data.desiredDeliveryDate) && (
        <section className="card space-y-2 p-5 text-sm">
          {data.desiredDeliveryDate && (
            <p>
              <span className="text-ink-muted">희망 납품일</span>{" "}
              <span className="font-medium">{data.desiredDeliveryDate}</span>
            </p>
          )}
          {data.memo && (
            <p>
              <span className="text-ink-muted">메모</span>{" "}
              <span className="font-medium">{data.memo}</span>
            </p>
          )}
        </section>
      )}

      <section className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/orders" className="btn-ghost">
          ← 목록
        </Link>
        <div className="flex flex-wrap gap-2">
          {data.status === "requested" && (
            <>
              <button
                disabled={updateStatus.isPending}
                onClick={() => updateStatus.mutate("approved")}
                className="btn-primary"
              >
                <CheckIcon width={16} height={16} className="mr-1" />
                승인
              </button>
              <button
                disabled={updateStatus.isPending}
                onClick={() => updateStatus.mutate("cancelled")}
                className="btn-ghost text-rose-600"
              >
                <XIcon width={16} height={16} className="mr-1" />
                반려
              </button>
            </>
          )}
          {data.status === "approved" && (
            <button
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate("shipping")}
              className="btn-primary"
            >
              배송 시작
            </button>
          )}
          {data.status === "shipping" && (
            <button
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate("delivered")}
              className="btn-primary"
            >
              납품 완료 처리
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function timestampFor(
  step: OrderStatus,
  data: {
    requestedAt: string;
    approvedAt?: string;
    shippedAt?: string;
    deliveredAt?: string;
  },
): string {
  if (step === "requested" && data.requestedAt) return formatDateTime(data.requestedAt);
  if (step === "approved" && data.approvedAt)   return formatDateTime(data.approvedAt);
  if (step === "shipping" && data.shippedAt)    return formatDateTime(data.shippedAt);
  if (step === "delivered" && data.deliveredAt) return formatDateTime(data.deliveredAt);
  return "";
}
