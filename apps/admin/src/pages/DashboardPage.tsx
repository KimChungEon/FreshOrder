import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@freshorder/shared";
import type { OrderStatus } from "@freshorder/shared";
import { PageHeader } from "../components/PageHeader";
import { OrderStatusBadge } from "../components/StatusBadge";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
} from "../components/States";
import { formatKRW, formatDateTime, todayYMD } from "../lib/format";
import {
  CardIcon,
  CheckIcon,
  OrderIcon,
  PackageIcon,
  XIcon,
} from "../components/icons";

export default function DashboardPage() {
  const qc = useQueryClient();

  const orders = useQuery({
    queryKey: ["orders", "all"],
    queryFn: () => api.getOrders(),
  });
  const stores = useQuery({
    queryKey: ["stores"],
    queryFn: () => api.listStores(),
  });
  const settlements = useQuery({
    queryKey: ["settlements", "all"],
    queryFn: () => api.getSettlements(),
  });

  const updateStatus = useMutation({
    mutationFn: (vars: { orderId: string; status: OrderStatus }) =>
      api.updateOrderStatus(vars.orderId, vars.status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order"] });
    },
  });

  if (orders.isLoading || stores.isLoading || settlements.isLoading) {
    return <LoadingBlock />;
  }
  if (orders.isError || stores.isError || settlements.isError) {
    return (
      <ErrorBlock
        onRetry={() => {
          orders.refetch();
          stores.refetch();
          settlements.refetch();
        }}
      />
    );
  }

  const orderList = orders.data ?? [];
  const storeList = stores.data ?? [];
  const setList = settlements.data ?? [];

  const today = todayYMD();
  const yyyymm = today.slice(0, 7);

  const todayNew = orderList.filter((o) => o.requestedAt.startsWith(today));
  const awaiting = orderList.filter((o) => o.status === "requested");
  const shipping = orderList.filter((o) => o.status === "shipping");
  const monthRevenue = orderList
    .filter((o) => o.status === "delivered" && (o.deliveredAt ?? "").startsWith(yyyymm))
    .reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="대시보드"
        subtitle="전체 운영 현황을 한눈에 확인하세요"
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="오늘 신규 발주"
          value={`${todayNew.length}건`}
          tint="blue"
          Icon={OrderIcon}
        />
        <StatCard
          label="승인 대기"
          value={`${awaiting.length}건`}
          tint="amber"
          Icon={PackageIcon}
        />
        <StatCard
          label="배송 중"
          value={`${shipping.length}건`}
          tint="violet"
          Icon={OrderIcon}
        />
        <StatCard
          label="이번달 매출"
          value={formatKRW(monthRevenue)}
          tint="emerald"
          Icon={CardIcon}
        />
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-sm font-semibold">승인 대기 발주</h2>
          <Link to="/orders" className="text-xs font-medium text-primary">
            전체 발주 →
          </Link>
        </div>
        {awaiting.length === 0 ? (
          <div className="p-6">
            <EmptyBlock title="대기 중인 발주가 없습니다" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-canvas">
              <tr>
                <th className="th">발주번호</th>
                <th className="th">점포</th>
                <th className="th">품목</th>
                <th className="th text-right">금액</th>
                <th className="th">요청일시</th>
                <th className="th text-right">처리</th>
              </tr>
            </thead>
            <tbody>
              {awaiting.map((o) => (
                <tr key={o.id} className="border-t border-line">
                  <td className="td">
                    <Link
                      to={`/orders/${o.id}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {o.orderNo}
                    </Link>
                  </td>
                  <td className="td">{o.storeName}</td>
                  <td className="td text-ink-muted">{o.items.length}개 품목</td>
                  <td className="td text-right font-semibold">
                    {formatKRW(o.total)}
                  </td>
                  <td className="td text-ink-muted">
                    {formatDateTime(o.requestedAt)}
                  </td>
                  <td className="td text-right">
                    <div className="inline-flex gap-1.5">
                      <button
                        disabled={updateStatus.isPending}
                        onClick={() =>
                          updateStatus.mutate({
                            orderId: o.id,
                            status: "approved",
                          })
                        }
                        className="btn-soft"
                      >
                        <CheckIcon width={14} height={14} />
                        승인
                      </button>
                      <button
                        disabled={updateStatus.isPending}
                        onClick={() =>
                          updateStatus.mutate({
                            orderId: o.id,
                            status: "cancelled",
                          })
                        }
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
        <div className="border-b border-line px-5 py-3 text-sm font-semibold">
          점포별 현황
        </div>
        <table className="w-full">
          <thead className="bg-canvas">
            <tr>
              <th className="th">점포</th>
              <th className="th text-right">발주 건수</th>
              <th className="th text-right">매출 (전체)</th>
              <th className="th text-right">미수금</th>
            </tr>
          </thead>
          <tbody>
            {storeList.map((s) => {
              const sOrders = orderList.filter((o) => o.storeId === s.id);
              const sRevenue = sOrders
                .filter((o) => o.status !== "cancelled")
                .reduce((sum, o) => sum + o.total, 0);
              const sOutstanding = setList
                .filter((x) => x.storeId === s.id)
                .reduce((sum, x) => sum + x.outstanding, 0);
              return (
                <tr key={s.id} className="border-t border-line">
                  <td className="td">
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs text-ink-muted">{s.address}</div>
                  </td>
                  <td className="td text-right">{sOrders.length}건</td>
                  <td className="td text-right">{formatKRW(sRevenue)}</td>
                  <td className="td text-right">
                    {sOutstanding > 0 ? (
                      <span className="font-semibold text-rose-600">
                        {formatKRW(sOutstanding)}
                      </span>
                    ) : (
                      <span className="text-ink-muted">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tint,
  Icon,
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
