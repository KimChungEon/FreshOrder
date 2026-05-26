"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@freshorder/shared";
import { useAuth } from "../../../lib/store/auth";
import { PageHeader } from "../../../components/PageHeader";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
} from "../../../components/States";
import { formatKRW } from "../../../lib/format";

export default function SettlementsPage() {
  const storeId = useAuth((s) => s.storeId);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["settlements", storeId],
    queryFn: () => api.getSettlements(storeId ? { storeId } : {}),
    enabled: !!storeId,
  });

  if (isLoading) return <LoadingBlock />;
  if (isError) return <ErrorBlock onRetry={refetch} />;

  const list = data ?? [];
  const unpaid = list.reduce((s, x) => s + x.unpaidAmount, 0);
  const totalOrder = list.reduce((s, x) => s + x.totalAmount, 0);

  return (
    <div className="space-y-5">
      <PageHeader title="정산" subtitle="월별 정산 내역과 미수금을 확인합니다" />

      <section className="card overflow-hidden">
        <div className="bg-primary p-5 text-white">
          <p className="text-xs/relaxed opacity-80">현재 미정산 잔액</p>
          <p className="mt-1 text-3xl font-bold">{formatKRW(unpaid)}</p>
          <p className="mt-1 text-xs/relaxed opacity-80">
            누적 발주금액 {formatKRW(totalOrder)}
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">월별 정산 내역</h2>
        {list.length === 0 ? (
          <EmptyBlock title="정산 내역이 없습니다" />
        ) : (
          <ul className="card divide-y divide-line">
            {list.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold">{s.year}년 {s.month}월</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    총 {formatKRW(s.totalAmount)} · 입금 {formatKRW(s.paidAmount)}
                  </p>
                  {s.unpaidAmount > 0 && (
                    <p className="mt-0.5 text-xs font-medium text-rose-600">
                      미수 {formatKRW(s.unpaidAmount)}
                    </p>
                  )}
                </div>
                <span className="chip bg-canvas text-ink-muted">{s.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
