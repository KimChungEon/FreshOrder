import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@freshorder/shared";
import { PageHeader } from "../components/PageHeader";
import { PaidBadge } from "../components/StatusBadge";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
} from "../components/States";
import { formatKRW, monthLabel } from "../lib/format";

export default function SettlementsPage() {
  const qc = useQueryClient();
  const [storeId, setStoreId] = useState<string>("all");

  const stores = useQuery({
    queryKey: ["stores"],
    queryFn: () => api.listStores(),
  });
  const settlements = useQuery({
    queryKey: ["settlements", "all"],
    queryFn: () => api.getSettlements(),
  });

  const markPaid = useMutation({
    mutationFn: (id: string) => api.markSettlementPaid(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settlements"] }),
  });

  const filtered = useMemo(() => {
    const list = settlements.data ?? [];
    return storeId === "all"
      ? list
      : list.filter((s) => s.storeId === storeId);
  }, [settlements.data, storeId]);

  const totalOutstanding = filtered.reduce((s, x) => s + x.outstanding, 0);

  if (settlements.isLoading || stores.isLoading) return <LoadingBlock />;
  if (settlements.isError) return <ErrorBlock onRetry={settlements.refetch} />;

  // 점포별 미수금 합계
  const perStore = (stores.data ?? []).map((s) => ({
    store: s,
    outstanding: (settlements.data ?? [])
      .filter((x) => x.storeId === s.id)
      .reduce((sum, x) => sum + x.outstanding, 0),
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="정산 관리"
        subtitle="점포별 미수금과 월별 정산을 관리합니다"
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {perStore.map(({ store, outstanding }) => (
          <button
            key={store.id}
            onClick={() => setStoreId(store.id)}
            className={`card p-5 text-left transition ${
              storeId === store.id ? "ring-2 ring-primary/40" : ""
            }`}
          >
            <p className="text-xs text-ink-muted">{store.name}</p>
            <p
              className={`mt-1 text-2xl font-bold ${
                outstanding > 0 ? "text-rose-600" : "text-ink"
              }`}
            >
              {formatKRW(outstanding)}
            </p>
            <p className="mt-1 text-[11px] text-ink-subtle">미수금</p>
          </button>
        ))}
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
          <h2 className="text-sm font-semibold">월별 정산 내역</h2>
          <div className="flex items-center gap-3">
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="input w-44 py-1.5 text-xs"
            >
              <option value="all">전체 점포</option>
              {(stores.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-ink-muted">
              총 미수 {formatKRW(totalOutstanding)}
            </span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyBlock title="정산 내역이 없습니다" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-canvas">
              <tr>
                <th className="th">기간</th>
                <th className="th">점포</th>
                <th className="th text-right">발주건수</th>
                <th className="th text-right">총액</th>
                <th className="th text-right">납부</th>
                <th className="th text-right">미수금</th>
                <th className="th">상태</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="td font-medium">{monthLabel(s.period)}</td>
                  <td className="td">{s.storeName}</td>
                  <td className="td text-right">{s.orderCount}</td>
                  <td className="td text-right">
                    {formatKRW(s.totalOrderAmount)}
                  </td>
                  <td className="td text-right">
                    {formatKRW(s.totalPaidAmount)}
                  </td>
                  <td className="td text-right">
                    {s.outstanding > 0 ? (
                      <span className="font-semibold text-rose-600">
                        {formatKRW(s.outstanding)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="td">
                    <PaidBadge outstanding={s.outstanding} />
                  </td>
                  <td className="td text-right">
                    {s.outstanding > 0 ? (
                      <button
                        disabled={markPaid.isPending}
                        onClick={() => markPaid.mutate(s.id)}
                        className="btn-soft"
                      >
                        정산 완료 처리
                      </button>
                    ) : (
                      <span className="text-xs text-ink-muted">완료</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
