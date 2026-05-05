"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@freshorder/shared";
import { useAuth } from "../../../lib/store/auth";
import { PageHeader } from "../../../components/PageHeader";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
} from "../../../components/States";
import { formatKRW, monthLabel } from "../../../lib/format";

export default function SettlementsPage() {
  const store = useAuth((s) => s.store);
  const [paying, setPaying] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["settlements", store?.id],
    queryFn: () => api.getSettlements({ storeId: store?.id }),
    enabled: !!store,
  });

  if (isLoading) return <LoadingBlock />;
  if (isError) return <ErrorBlock onRetry={refetch} />;

  const list = data ?? [];
  const outstanding = list.reduce((s, x) => s + x.outstanding, 0);
  const totalOrder = list.reduce((s, x) => s + x.totalOrderAmount, 0);

  const onPay = async () => {
    setPaying(true);
    await new Promise((r) => setTimeout(r, 700));
    setPaying(false);
    alert("결제 모듈 연동 전입니다. (데모)");
  };

  return (
    <div className="space-y-5">
      <PageHeader title="정산" subtitle="월별 정산 내역과 미수금을 확인합니다" />

      <section className="card overflow-hidden">
        <div className="bg-primary p-5 text-white">
          <p className="text-xs/relaxed opacity-80">현재 미정산 잔액</p>
          <p className="mt-1 text-3xl font-bold">{formatKRW(outstanding)}</p>
          <p className="mt-1 text-xs/relaxed opacity-80">
            누적 발주금액 {formatKRW(totalOrder)}
          </p>
        </div>
        <div className="p-4">
          <button
            disabled={outstanding === 0 || paying}
            onClick={onPay}
            className="btn-primary w-full"
          >
            {paying ? "결제 진행 중…" : "즉시 결제"}
          </button>
          {outstanding === 0 && (
            <p className="mt-2 text-center text-xs text-ink-muted">
              미정산 잔액이 없습니다
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">월별 정산 내역</h2>
        {list.length === 0 ? (
          <EmptyBlock title="정산 내역이 없습니다" />
        ) : (
          <ul className="card divide-y divide-line">
            {list.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="text-sm font-semibold">{monthLabel(s.period)}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    발주 {s.orderCount}건 · 총 {formatKRW(s.totalOrderAmount)}
                  </p>
                  {s.outstanding > 0 && (
                    <p className="mt-0.5 text-xs font-medium text-rose-600">
                      미수 {formatKRW(s.outstanding)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => alert("정산서 PDF는 데모에서 제공되지 않습니다.")}
                  className="btn-ghost text-xs"
                >
                  정산서 보기
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
