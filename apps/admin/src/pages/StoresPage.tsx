import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@freshorder/shared";
import type { OrderStatus } from "@freshorder/shared";
import { PageHeader } from "../components/PageHeader";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
} from "../components/States";
import { formatKRW, formatDate } from "../lib/format";

const IN_PROGRESS_STATUSES: OrderStatus[] = [
  "REQUESTED",
  "ACCEPTED",
  "APPROVED",
  "SHIPPING",
];

export default function StoresPage() {
  const stores = useQuery({
    queryKey: ["stores"],
    queryFn: () => api.getStores(),
  });
  const orders = useQuery({
    queryKey: ["orders", "all"],
    queryFn: () => api.getOrders({ limit: 200 }),
  });
  const settlements = useQuery({
    queryKey: ["settlements", "all"],
    queryFn: () => api.getSettlements(),
  });

  if (stores.isLoading || orders.isLoading || settlements.isLoading) {
    return <LoadingBlock />;
  }
  if (stores.isError) return <ErrorBlock onRetry={stores.refetch} />;

  const storeList = stores.data ?? [];
  const orderList = orders.data?.items ?? [];
  const setList = settlements.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title="점포 관리" subtitle="직영점 정보와 운영 현황" />

      {storeList.length === 0 ? (
        <EmptyBlock title="등록된 점포가 없습니다" />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {storeList.map((s) => {
            const sOrders = orderList.filter((o) => o.storeId === s.id);
            const inProgress = sOrders.filter((o) =>
              IN_PROGRESS_STATUSES.includes(o.status),
            ).length;
            const revenue = sOrders
              .filter((o) => o.status !== "REJECTED")
              .reduce((sum, o) => sum + o.totalAmount, 0);
            const outstanding = setList
              .filter((x) => x.storeId === s.id)
              .reduce((sum, x) => sum + x.unpaidAmount, 0);
            return (
              <article key={s.id} className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-line bg-canvas/30 px-5 py-3">
                  <div>
                    <h3 className="text-base font-bold">{s.storeName}</h3>
                    <p className="text-xs text-ink-muted">{s.address}</p>
                  </div>
                  <Link
                    to={`/orders?store=${s.id}`}
                    className="btn-ghost text-xs"
                  >
                    발주 보기
                  </Link>
                </div>
                <div className="grid grid-cols-3 divide-x divide-line">
                  <Stat label="발주 (전체)" value={`${sOrders.length}건`} />
                  <Stat label="진행 중" value={`${inProgress}건`} />
                  <Stat
                    label="미수금"
                    value={outstanding > 0 ? formatKRW(outstanding) : "0원"}
                    tone={outstanding > 0 ? "rose" : undefined}
                  />
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line p-5 text-sm">
                  <Row label="매출" value={formatKRW(revenue)} />
                  <Row label="등록일" value={formatDate(s.createdAt)} />
                  <Row label="대표 전화" value={s.phone ?? "-"} />
                  <Row
                    label="상태"
                    value={s.status === "ACTIVE" ? "운영 중" : "중지"}
                  />
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "rose";
}) {
  return (
    <div className="px-4 py-4 text-center">
      <p className="text-xs text-ink-muted">{label}</p>
      <p
        className={`mt-1 text-base font-bold ${
          tone === "rose" ? "text-rose-600" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
