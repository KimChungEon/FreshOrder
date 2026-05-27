"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { api } from "@freshorder/shared";
import type { InventoryItem, InventoryStatus } from "@freshorder/shared";
import { useAuth } from "../../../lib/store/auth";
import { useCart } from "../../../lib/store/cart";
import { PageHeader } from "../../../components/PageHeader";
import { InventoryStatusBadge } from "../../../components/StatusBadge";
import {
  ErrorBlock,
  LoadingBlock,
  EmptyBlock,
} from "../../../components/States";

type Tab = "all" | InventoryStatus;

const TABS: { value: Tab; label: string }[] = [
  { value: "all",        label: "전체" },
  { value: "EMPTY",      label: "품절" },
  { value: "SHORTAGE",   label: "부족" },
  { value: "WARNING",    label: "주의" },
  { value: "SUFFICIENT", label: "충분" },
];

export default function InventoryPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const storeId = useAuth((s) => s.storeId);
  const cart = useCart();

  const [tab, setTab] = useState<Tab>("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["inventory", storeId],
    queryFn: () => api.getInventory(storeId!),
    enabled: !!storeId,
  });

  const updateQty = useMutation({
    mutationFn: ({ productId, qty }: { productId: string; qty: number }) =>
      api.updateInventoryItem(storeId!, productId, { currentQty: qty }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", storeId] }),
  });

  if (isLoading) return <LoadingBlock />;
  if (isError) return <ErrorBlock onRetry={refetch} />;

  const list = data ?? [];
  const counts = {
    empty: list.filter((i) => i.status === "EMPTY").length,
    shortage: list.filter((i) => i.status === "SHORTAGE").length,
    warning: list.filter((i) => i.status === "WARNING").length,
    sufficient: list.filter((i) => i.status === "SUFFICIENT").length,
  };
  const filtered = tab === "all" ? list : list.filter((i) => i.status === tab);

  const bulkRestockShortage = () => {
    list
      .filter((i) => i.status === "EMPTY" || i.status === "SHORTAGE")
      .forEach((i) => {
        const recommended = Math.max(1, (i.minQty - i.currentQty) || 1);
        cart.add(i.productId, recommended);
      });
    router.push("/orders/new");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="재고 관리"
        subtitle="최소 재고 미만 품목은 즉시 발주를 권장합니다"
      />

      <section className="grid grid-cols-4 gap-3">
        <SummaryCard tone="rose" label="품절" count={counts.empty}
          active={tab === "EMPTY"} onClick={() => setTab(tab === "EMPTY" ? "all" : "EMPTY")} />
        <SummaryCard tone="rose" label="부족" count={counts.shortage}
          active={tab === "SHORTAGE"} onClick={() => setTab(tab === "SHORTAGE" ? "all" : "SHORTAGE")} />
        <SummaryCard tone="amber" label="주의" count={counts.warning}
          active={tab === "WARNING"} onClick={() => setTab(tab === "WARNING" ? "all" : "WARNING")} />
        <SummaryCard tone="emerald" label="충분" count={counts.sufficient}
          active={tab === "SUFFICIENT"} onClick={() => setTab(tab === "SUFFICIENT" ? "all" : "SUFFICIENT")} />
      </section>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={clsx("tab whitespace-nowrap", tab === t.value ? "tab-active" : "tab-inactive")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyBlock title="해당 상태의 재고가 없습니다" />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((i) => (
            <InventoryRow
              key={i.id}
              inv={i}
              saving={updateQty.isPending && updateQty.variables?.productId === i.productId}
              onSave={(qty) => updateQty.mutate({ productId: i.productId, qty })}
              onAddToCart={(qty) => {
                cart.add(i.productId, qty);
                router.push("/orders/new");
              }}
            />
          ))}
        </ul>
      )}

      {(counts.shortage + counts.empty) > 0 && (
        <div className="sticky bottom-20 z-10 md:bottom-4">
          <button onClick={bulkRestockShortage} className="btn-primary w-full shadow-lg">
            부족분 {counts.empty + counts.shortage}개 일괄 발주
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label, count, tone, active, onClick,
}: {
  label: string;
  count: number;
  tone: "rose" | "amber" | "emerald";
  active: boolean;
  onClick: () => void;
}) {
  const palette = {
    rose:    { ring: "ring-rose-300",    text: "text-rose-700",    bg: "bg-rose-50" },
    amber:   { ring: "ring-amber-300",   text: "text-amber-700",   bg: "bg-amber-50" },
    emerald: { ring: "ring-emerald-300", text: "text-emerald-700", bg: "bg-emerald-50" },
  } as const;
  const p = palette[tone];
  return (
    <button onClick={onClick} className={clsx("card p-4 text-left transition", active ? `ring-2 ${p.ring}` : "")}>
      <p className={clsx("text-xs font-medium", p.text)}>{label}</p>
      <p className="mt-1 text-xl font-bold">{count}</p>
      <span className={clsx("chip mt-2", p.bg, p.text)}>품목</span>
    </button>
  );
}

function InventoryRow({
  inv, saving, onSave, onAddToCart,
}: {
  inv: InventoryItem;
  saving: boolean;
  onSave: (qty: number) => void;
  onAddToCart: (qty: number) => void;
}) {
  const [val, setVal] = useState(inv.currentQty);
  const recommended = Math.max(1, inv.minQty - inv.currentQty);
  const ratio = Math.min(100, inv.minQty === 0 ? 100 : Math.round((inv.currentQty / inv.minQty) * 100));
  const barColor =
    inv.status === "EMPTY" || inv.status === "SHORTAGE"
      ? "bg-rose-500"
      : inv.status === "WARNING"
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <li className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{inv.product.name}</p>
            <InventoryStatusBadge status={inv.status} />
          </div>
          <p className="mt-0.5 text-xs text-ink-muted">
            현재 {inv.currentQty} {inv.product.unit} / 최소 {inv.minQty}
          </p>
        </div>
        <button onClick={() => onAddToCart(recommended)} className="btn-soft text-xs">
          +{recommended} 발주 추가
        </button>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-canvas">
        <div className={clsx("h-full transition-all", barColor)} style={{ width: `${ratio}%` }} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="number" min={0} value={val}
          onChange={(e) => setVal(Number(e.target.value))}
          className="input w-24"
        />
        <button disabled={saving || val === inv.currentQty} onClick={() => onSave(val)} className="btn-ghost text-xs">
          {saving ? "저장중…" : "저장"}
        </button>
        <span className="ml-auto text-xs text-ink-muted">추천 발주량 {recommended}</span>
      </div>
    </li>
  );
}
