"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@freshorder/shared";
import { useAuth } from "../../../lib/store/auth";
import { PageHeader } from "../../../components/PageHeader";
import { OrderStatusBadge } from "../../../components/StatusBadge";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
} from "../../../components/States";
import { formatKRW, formatDate } from "../../../lib/format";
import {
  AlertIcon,
  ChevronRightIcon,
  PackageIcon,
  TruckIcon,
  CardIcon,
} from "../../../components/icons";

export default function DashboardPage() {
  const store = useAuth((s) => s.store);
  const storeId = store?.id;

  const orders = useQuery({
    queryKey: ["orders", storeId],
    queryFn: () => api.getOrders({ storeId }),
    enabled: !!storeId,
  });
  const inventory = useQuery({
    queryKey: ["inventory", storeId],
    queryFn: () => api.getInventory(storeId),
    enabled: !!storeId,
  });
  const settlements = useQuery({
    queryKey: ["settlements", storeId],
    queryFn: () => api.getSettlements({ storeId }),
    enabled: !!storeId,
  });

  if (orders.isLoading || inventory.isLoading || settlements.isLoading) {
    return <LoadingBlock />;
  }
  if (orders.isError || inventory.isError || settlements.isError) {
    return (
      <ErrorBlock
        onRetry={() => {
          orders.refetch();
          inventory.refetch();
          settlements.refetch();
        }}
      />
    );
  }

  const orderList = orders.data ?? [];
  const invList = inventory.data ?? [];
  const setList = settlements.data ?? [];

  const inProgress = orderList.filter((o) =>
    ["requested", "approved", "shipping"].includes(o.status),
  );
  const now = new Date();
  const yyyymm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthDelivered = orderList.filter(
    (o) => o.status === "delivered" && (o.deliveredAt ?? "").startsWith(yyyymm),
  );
  const shortage = invList.filter((i) => i.status === "shortage");
  const outstanding = setList.reduce((s, x) => s + x.outstanding, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`안녕하세요, ${store?.name ?? ""} 사장님`}
        subtitle="오늘의 운영 현황을 한눈에 확인하세요"
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="진행중 발주"
          value={`${inProgress.length}건`}
          tint="blue"
          Icon={TruckIcon}
        />
        <StatCard
          label="이번달 완료"
          value={`${monthDelivered.length}건`}
          tint="emerald"
          Icon={PackageIcon}
        />
        <StatCard
          label="재고 부족"
          value={`${shortage.length}품목`}
          tint="rose"
          Icon={AlertIcon}
        />
        <StatCard
          label="미정산 금액"
          value={formatKRW(outstanding)}
          tint="amber"
          Icon={CardIcon}
        />
      </section>

      <section className="card p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">재고 부족 알림</h2>
          <Link
            href="/inventory"
            className="text-xs font-medium text-primary"
          >
            재고 관리 →
          </Link>
        </div>
        {shortage.length === 0 ? (
          <EmptyBlock title="재고가 모두 충분합니다" />
        ) : (
          <ul className="divide-y divide-line">
            {shortage.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{i.productName}</p>
                  <p className="text-xs text-ink-muted">
                    현재 {i.qty} / 안전재고 {i.safetyQty}
                  </p>
                </div>
                <Link
                  href={`/orders/new?productId=${i.productId}`}
                  className="btn-soft"
                >
                  바로 발주
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">최근 발주</h2>
          <Link href="/orders" className="text-xs font-medium text-primary">
            전체 보기 →
          </Link>
        </div>
        {orderList.length === 0 ? (
          <EmptyBlock title="아직 발주 내역이 없습니다" />
        ) : (
          <ul className="divide-y divide-line">
            {orderList.slice(0, 5).map((o) => (
              <li key={o.id}>
                <Link
                  href={`/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{o.orderNo}</p>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="text-xs text-ink-muted">
                      {formatDate(o.requestedAt)} · {o.items.length}개 품목 ·{" "}
                      {formatKRW(o.total)}
                    </p>
                  </div>
                  <ChevronRightIcon className="text-ink-subtle" />
                </Link>
              </li>
            ))}
          </ul>
        )}
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
  tint: "blue" | "emerald" | "rose" | "amber";
  Icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element;
}) {
  const tintMap = {
    blue:    "bg-primary-50 text-primary-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose:    "bg-rose-50 text-rose-700",
    amber:   "bg-amber-50 text-amber-700",
  } as const;
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tintMap[tint]}`}>
          <Icon width={18} height={18} />
        </span>
      </div>
      <p className="mt-3 text-xs text-ink-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold">{value}</p>
    </div>
  );
}
