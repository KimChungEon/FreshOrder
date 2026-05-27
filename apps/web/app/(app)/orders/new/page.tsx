"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { api } from "@freshorder/shared";
import type { Product } from "@freshorder/shared";
import { useAuth } from "../../../../lib/store/auth";
import { useCart } from "../../../../lib/store/cart";
import { PageHeader } from "../../../../components/PageHeader";
import {
  ErrorBlock,
  LoadingBlock,
  EmptyBlock,
  Spinner,
} from "../../../../components/States";
import { formatKRW } from "../../../../lib/format";
import {
  MinusIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
} from "../../../../components/icons";

export default function NewOrderPage() {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const storeId = useAuth((s) => s.storeId);

  const cart = useCart();
  const [activeCat, setActiveCat] = useState<string>("all");
  const [keyword, setKeyword] = useState("");

  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
  });
  const products = useQuery({
    queryKey: ["products"],
    queryFn: () => api.getProducts({ limit: 100 }),
  });
  const favorites = useQuery({
    queryKey: ["favorites", storeId],
    queryFn: () => api.getFavorites(storeId!),
    enabled: !!storeId,
  });

  // 외부 진입 시 productId 쿼리 → 카트에 자동 추가
  const seededId = params.get("productId");
  useEffect(() => {
    if (!seededId) return;
    if (cart.lines.find((l) => l.productId === seededId)) return;
    cart.add(seededId, 1);
  }, [seededId]); // eslint-disable-line react-hooks/exhaustive-deps

  const productList = products.data?.items ?? [];

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return productList.filter((p) => {
      if (activeCat !== "all" && p.categoryId !== activeCat) return false;
      if (kw && !p.name.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [productList, activeCat, keyword]);

  const favSet = new Set((favorites.data ?? []).map((f) => f.productId));

  const toggleFav = useMutation({
    mutationFn: async (productId: string) => {
      if (!storeId) throw new Error("매장 정보 없음");
      if (favSet.has(productId)) {
        await api.removeFavorite(storeId, productId);
      } else {
        await api.addFavorite(storeId, productId);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites", storeId] }),
  });

  const subtotal = cart.lines.reduce((s, l) => {
    const p = productList.find((x) => x.id === l.productId);
    return s + (p?.unitPrice ?? 0) * l.qty;
  }, 0);
  const total = subtotal;

  const submit = useMutation({
    mutationFn: () =>
      api.createOrder({
        items: cart.lines.map(({ productId, qty }) => ({
          productId,
          quantity: qty,
        })),
        paymentType: "MONTHLY",
      }),
    onSuccess: (order) => {
      cart.clear();
      qc.invalidateQueries({ queryKey: ["orders"] });
      router.replace(`/orders/${order.id}`);
    },
  });

  if (cats.isLoading || products.isLoading) return <LoadingBlock />;
  if (cats.isError || products.isError) {
    return (
      <ErrorBlock
        onRetry={() => {
          cats.refetch();
          products.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-4 pb-32">
      <PageHeader title="신규 발주" subtitle="원하는 품목을 골라 한 번에 요청하세요" />

      <div className="card p-3">
        <div className="relative">
          <SearchIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
            width={18}
            height={18}
          />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="품목명 검색"
            className="input pl-9"
          />
        </div>
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <CatChip
          active={activeCat === "all"}
          onClick={() => setActiveCat("all")}
        >
          전체
        </CatChip>
        {(cats.data ?? []).map((c) => (
          <CatChip
            key={c.id}
            active={activeCat === c.id}
            onClick={() => setActiveCat(c.id)}
          >
            {c.name}
          </CatChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyBlock title="조건에 맞는 품목이 없습니다" />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((p) => {
            const line = cart.lines.find((l) => l.productId === p.id);
            return (
              <ProductRow
                key={p.id}
                product={p}
                qty={line?.qty ?? 0}
                favorited={favSet.has(p.id)}
                onAdd={() => cart.add(p.id, p.minOrderQty || 1)}
                onSetQty={(q) => cart.setQty(p.id, q)}
                onToggleFav={() => user && toggleFav.mutate(p.id)}
              />
            );
          })}
        </ul>
      )}

      {/* 하단 합계 도크 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[calc(env(safe-area-inset-bottom)+0px)] md:bottom-0 md:left-60">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 md:max-w-5xl md:px-6">
          <div>
            <p className="text-xs text-ink-muted">담은 품목 {cart.lines.length}개</p>
            <p className="text-lg font-bold">합계 {formatKRW(total)}</p>
          </div>
          <button
            disabled={cart.lines.length === 0 || submit.isPending}
            onClick={() => submit.mutate()}
            className="btn-primary min-w-32"
          >
            {submit.isPending ? <Spinner className="h-4 w-4 border-white" /> : "발주 요청"}
          </button>
        </div>
      </div>

      {submit.isError && (
        <p className="text-sm text-rose-600">발주 요청 중 오류가 발생했습니다.</p>
      )}

      <div className="text-center text-xs text-ink-muted">
        <Link href="/orders" className="underline">
          발주 내역으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

function CatChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "tab whitespace-nowrap",
        active ? "tab-active" : "tab-inactive",
      )}
    >
      {children}
    </button>
  );
}

function ProductRow({
  product,
  qty,
  favorited,
  onAdd,
  onSetQty,
  onToggleFav,
}: {
  product: Product;
  qty: number;
  favorited: boolean;
  onAdd: () => void;
  onSetQty: (q: number) => void;
  onToggleFav: () => void;
}) {
  const soldout = !product.isActive;
  return (
    <li className="card flex items-center gap-3 p-3">
      <button
        aria-label="즐겨찾기"
        onClick={onToggleFav}
        className={clsx(
          "rounded-full p-1.5",
          favorited ? "text-amber-500" : "text-ink-subtle hover:text-ink",
        )}
      >
        <StarIcon
          width={20}
          height={20}
          fill={favorited ? "currentColor" : "none"}
        />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{product.name}</p>
          {soldout && (
            <span className="chip bg-gray-100 text-gray-600">미판매</span>
          )}
        </div>
        <p className="text-xs text-ink-muted">
          {product.unit} · {formatKRW(product.unitPrice)}
        </p>
      </div>
      {qty === 0 ? (
        <button
          disabled={soldout}
          onClick={onAdd}
          className="btn-soft px-3 py-1.5 text-xs"
        >
          담기
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSetQty(qty - 1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink"
            aria-label="수량 감소"
          >
            <MinusIcon width={16} height={16} />
          </button>
          <span className="w-6 text-center text-sm font-semibold">{qty}</span>
          <button
            onClick={() => onSetQty(qty + 1)}
            disabled={soldout}
            className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white"
            aria-label="수량 증가"
          >
            <PlusIcon width={16} height={16} />
          </button>
        </div>
      )}
    </li>
  );
}
