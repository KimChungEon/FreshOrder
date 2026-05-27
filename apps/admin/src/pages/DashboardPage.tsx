import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@freshorder/shared";
import { PageHeader } from "../components/PageHeader";
import { OrderStatusBadge } from "../components/StatusBadge";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
} from "../components/States";
import { formatKRW, formatDateTime } from "../lib/format";
import {
  CardIcon,
  CheckIcon,
  OrderIcon,
  PackageIcon,
  XIcon,
} from "../components/icons";
import { useState } from "react";

export default function DashboardPage() {
  const qc = useQueryClient();

  const dash = useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: () => api.getAdminDashboard(),
  });

  const approve = useMutation({
    mutationFn: (orderId: string) => api.approveOrder(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard", "admin"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const [rejectingId, setRejectingId] = useState<string>();
  const [reason, setReason] = useState("");
  const reject = useMutation({
    mutationFn: (vars: { orderId: string; reason: string }) =>
      api.rejectOrder(vars.orderId, vars.reason),
    onSuccess: () => {
      setRejectingId(undefined);
      setReason("");
      qc.invalidateQueries({ queryKey: ["dashboard", "admin"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  if (dash.isLoading) return <LoadingBlock />;
  if (dash.isError || !dash.data) return <ErrorBlock onRetry={() => dash.refetch()} />;

  const d = dash.data;

  return (
    <div className="space-y-6">
      <PageHeader title="대시보드" subtitle="전체 운영 현황을 한눈에 확인하세요" />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="오늘 신규 발주" value={`${d.todayNewOrders}건`} tint="blue" Icon={OrderIcon} />
        <StatCard label="승인 대기" value={`${d.pendingOrders}건`} tint="amber" Icon={PackageIcon} />
        <StatCard label="배송 중" value={`${d.shippingOrders}건`} tint="violet" Icon={OrderIcon} />
        <StatCard label="이번달 매출" value={formatKRW(d.monthlySales)} tint="emerald" Icon={CardIcon} />
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-sm font-semibold">승인 대기 발주</h2>
          <Link to="/orders" className="text-xs font-medium text-primary">전체 발주 →</Link>
        </div>
        {d.pendingTop.length === 0 ? (
          <div className="p-6"><EmptyBlock title="대기 중인 발주가 없습니다" /></div>
        ) : (
          <table className="w-full">
            <thead className="bg-canvas">
              <tr>
                <th className="th">발주번호</th>
                <th className="th">점포</th>
                <th className="th">상태</th>
                <th className="th text-right">금액</th>
                <th className="th">요청일시</th>
                <th className="th text-right">처리</th>
              </tr>
            </thead>
            <tbody>
              {d.pendingTop.map((o) => (
                <tr key={o.id} className="border-t border-line">
                  <td className="td">
                    <Link to={`/orders/${o.id}`} className="font-semibold text-primary hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="td">{o.store?.storeName ?? "-"}</td>
                  <td className="td"><OrderStatusBadge status={o.status} /></td>
                  <td className="td text-right font-semibold">{formatKRW(o.totalAmount)}</td>
                  <td className="td text-ink-muted">{formatDateTime(o.requestedAt)}</td>
                  <td className="td text-right">
                    <div className="inline-flex gap-1.5">
                      <button
                        disabled={approve.isPending}
                        onClick={() => approve.mutate(o.id)}
                        className="btn-soft"
                      >
                        <CheckIcon width={14} height={14} />
                        승인
                      </button>
                      <button
                        disabled={reject.isPending}
                        onClick={() => setRejectingId(o.id)}
                        className="btn-danger"
                      >
                        <XIcon width={14} height={14} />
                        반려
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-line px-5 py-3 text-sm font-semibold">점포별 현황</div>
        <table className="w-full">
          <thead className="bg-canvas">
            <tr>
              <th className="th">점포</th>
              <th className="th">상태</th>
              <th className="th text-right">발주 건수</th>
            </tr>
          </thead>
          <tbody>
            {d.stores.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="td"><div className="font-semibold">{s.storeName}</div></td>
                <td className="td">{s.status}</td>
                <td className="td text-right">{s._count.orders}건</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {rejectingId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="card w-full max-w-sm space-y-3 p-5">
            <h3 className="text-sm font-semibold">반려 사유</h3>
            <textarea
              className="input resize-none"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="점주에게 표시할 반려 사유를 적어주세요"
            />
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => { setRejectingId(undefined); setReason(""); }}>취소</button>
              <button
                className="btn-danger"
                disabled={!reason.trim() || reject.isPending}
                onClick={() => reject.mutate({ orderId: rejectingId, reason: reason.trim() })}
              >
                반려 처리
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label, value, tint, Icon,
}: {
  label: string;
  value: string;
  tint: "blue" | "amber" | "emerald" | "violet";
  Icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element;
}) {
  const tintMap = {
    blue:    "bg-primary-50 text-primary-700",
    amber:   "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet:  "bg-violet-50 text-violet-700",
  } as const;
  return (
    <div className="card p-5">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tintMap[tint]}`}>
        <Icon width={20} height={20} />
      </span>
      <p className="mt-3 text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
