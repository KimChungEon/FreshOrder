import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@freshorder/shared";
import type { OrderStatus } from "@freshorder/shared";
import { PageHeader } from "../components/PageHeader";
import { OrderStatusBadge } from "../components/StatusBadge";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
} from "../components/States";
import { formatKRW, formatDate } from "../lib/format";

const STATUSES: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all",       label: "전체" },
  { value: "REQUESTED", label: "요청됨" },
  { value: "APPROVED",  label: "승인" },
  { value: "SHIPPING",  label: "배송중" },
  { value: "DELIVERED", label: "납품완료" },
  { value: "REJECTED",  label: "반려" },
  { value: "SETTLED",   label: "정산완료" },
];

export default function OrdersPage() {
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [storeId, setStoreId] = useState<string>("all");

  const stores = useQuery({
    queryKey: ["stores"],
    queryFn: () => api.getStores(),
  });
  const orders = useQuery({
    queryKey: ["orders", "admin", status, storeId],
    queryFn: () => api.getOrders({
      ...(status !== "all" ? { status } : {}),
      ...(storeId !== "all" ? { storeId } : {}),
      limit: 100,
    }),
  });

  const list = orders.data?.items ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title="발주 관리" subtitle="전체 직영점의 발주를 관리합니다" />

      <section className="card grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
        <div>
          <label className="label">상태</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="input">
            {STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
          </select>
        </div>
        <div>
          <label className="label">점포</label>
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="input">
            <option value="all">전체 점포</option>
            {(stores.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>{s.storeName}</option>
            ))}
          </select>
        </div>
      </section>

      {orders.isLoading ? (
        <LoadingBlock />
      ) : orders.isError ? (
        <ErrorBlock onRetry={orders.refetch} />
      ) : list.length === 0 ? (
        <EmptyBlock title="조건에 맞는 발주가 없습니다" />
      ) : (
        <section className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-canvas">
              <tr>
                <th className="th">발주번호</th>
                <th className="th">점포</th>
                <th className="th">상태</th>
                <th className="th text-right">품목수</th>
                <th className="th text-right">합계</th>
                <th className="th">요청일</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} className="border-t border-line hover:bg-canvas/40">
                  <td className="td font-semibold">
                    <Link to={`/orders/${o.id}`} className="text-primary hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="td">{o.store?.storeName ?? "-"}</td>
                  <td className="td"><OrderStatusBadge status={o.status} /></td>
                  <td className="td text-right text-ink-muted">{o._count?.orderItems ?? 0}</td>
                  <td className="td text-right font-semibold">{formatKRW(o.totalAmount)}</td>
                  <td className="td text-ink-muted">{formatDate(o.requestedAt)}</td>
                  <td className="td text-right">
                    <Link to={`/orders/${o.id}`} className="btn-ghost text-xs">상세</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
