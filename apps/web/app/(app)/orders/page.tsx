"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { api } from "@freshorder/shared";
import type { OrderStatus } from "@freshorder/shared";
import { useAuth } from "../../../lib/store/auth";
import { PageHeader } from "../../../components/PageHeader";
import { OrderStatusBadge } from "../../../components/StatusBadge";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
} from "../../../components/States";
import { formatKRW, formatDate } from "../../../lib/format";
import { ChevronRightIcon, PlusIcon } from "../../../components/icons";

const TABS: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all",       label: "전체" },
  { value: "requested", label: "요청됨" },
  { value: "approved",  label: "승인" },
  { value: "shipping",  label: "배송중" },
  { value: "delivered", label: "납품완료" },
  { value: "cancelled", label: "취소" },
];

export default function OrdersPage() {
  const store = useAuth((s) => s.store);
  const [tab, setTab] = useState<"all" | OrderStatus>("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["orders", store?.id],
    queryFn: () => api.getOrders({ storeId: store?.id }),
    enabled: !!store,
  });

  const filtered =
    tab === "all" ? data ?? [] : (data ?? []).filter((o) => o.status === tab);

  return (
    <div className="space-y-4">
      <PageHeader
        title="발주 내역"
        subtitle="이전에 요청한 발주를 확인할 수 있습니다"
        action={
          <Link href="/orders/new" className="btn-primary">
            <PlusIcon className="mr-1" /> 신규 발주
          </Link>
        }
      />

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={clsx(
              "tab whitespace-nowrap",
              tab === t.value ? "tab-active" : "tab-inactive",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : isError ? (
        <ErrorBlock onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyBlock
          title="해당 상태의 발주가 없습니다"
          action={
            <Link href="/orders/new" className="btn-soft">
              발주 시작하기
            </Link>
          }
        />
      ) : (
        <ul className="card divide-y divide-line">
          {filtered.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orders/${o.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{o.orderNo}</p>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {formatDate(o.requestedAt)} · {o.items.length}개 품목
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {formatKRW(o.total)}
                  </span>
                  <ChevronRightIcon className="text-ink-subtle" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
