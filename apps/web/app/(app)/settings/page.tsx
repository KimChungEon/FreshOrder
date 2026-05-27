"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@freshorder/shared";
import { useAuth } from "../../../lib/store/auth";
import { PageHeader } from "../../../components/PageHeader";

interface NotifPrefs {
  orderProgress: boolean;
  inventoryAlert: boolean;
  settlement: boolean;
  newPost: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, storeId, logout } = useAuth();
  const storeQ = useQuery({
    queryKey: ["store", storeId],
    queryFn: () => api.getStoreDetail(storeId!),
    enabled: !!storeId,
  });
  const store = storeQ.data;

  const [prefs, setPrefs] = useState<NotifPrefs>({
    orderProgress: true,
    inventoryAlert: true,
    settlement: true,
    newPost: false,
  });

  const onLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="space-y-5">
      <PageHeader title="마이페이지" subtitle="매장과 알림 설정을 관리합니다" />

      <section className="card space-y-3 p-5">
        <h2 className="text-sm font-semibold">매장 정보</h2>
        <dl className="divide-y divide-line text-sm">
          <Row label="매장명" value={store?.storeName} />
          <Row label="대표자" value={user?.name} />
          <Row label="이메일" value={user?.email} />
          <Row label="전화" value={user?.phone ?? undefined} />
          <Row label="주소" value={store?.address} />
          <Row label="누적 발주" value={store ? `${store.summary.orderCount}건` : undefined} />
        </dl>
        <button
          onClick={() => alert("매장 정보 수정은 데모에서 제공되지 않습니다.")}
          className="btn-ghost w-full"
        >
          매장 정보 수정
        </button>
      </section>

      <section className="card space-y-2 p-5">
        <h2 className="mb-2 text-sm font-semibold">알림 설정</h2>
        <Toggle
          label="발주 진행 알림"
          desc="승인 / 배송 / 납품 단계 변경 시"
          checked={prefs.orderProgress}
          onChange={(v) => setPrefs({ ...prefs, orderProgress: v })}
        />
        <Toggle
          label="재고 부족 알림"
          desc="안전 재고 미만 시"
          checked={prefs.inventoryAlert}
          onChange={(v) => setPrefs({ ...prefs, inventoryAlert: v })}
        />
        <Toggle
          label="정산 알림"
          desc="월별 정산서 발행 시"
          checked={prefs.settlement}
          onChange={(v) => setPrefs({ ...prefs, settlement: v })}
        />
        <Toggle
          label="신규 게시글 알림"
          desc="공지/Q&A/건의 새 글 등록 시"
          checked={prefs.newPost}
          onChange={(v) => setPrefs({ ...prefs, newPost: v })}
        />
      </section>

      <section className="card p-5">
        <button onClick={onLogout} className="btn-ghost w-full text-rose-600">
          로그아웃
        </button>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="text-right text-sm font-medium">{value ?? "-"}</dd>
    </div>
  );
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-2 text-left hover:bg-canvas"
    >
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-ink-muted">{desc}</p>}
      </div>
      <span
        className={[
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
          checked ? "bg-primary" : "bg-line",
        ].join(" ")}
        aria-checked={checked}
        role="switch"
      >
        <span
          className={[
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
            checked ? "translate-x-5" : "translate-x-0.5",
          ].join(" ")}
        />
      </span>
    </button>
  );
}
