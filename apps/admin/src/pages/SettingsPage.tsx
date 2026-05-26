import { useState } from "react";
import { useAuth } from "../lib/store/auth";
import { PageHeader } from "../components/PageHeader";
import { formatDate } from "../lib/format";

interface Prefs {
  newOrder: boolean;
  newPost: boolean;
  outstandingDigest: boolean;
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>({
    newOrder: true,
    newPost: true,
    outstandingDigest: false,
  });

  return (
    <div className="space-y-5">
      <PageHeader title="설정" subtitle="관리자 계정과 알림을 설정합니다" />

      <section className="card space-y-3 p-6">
        <h2 className="text-sm font-semibold">관리자 정보</h2>
        <dl className="divide-y divide-line text-sm">
          <Row label="이름" value={user?.name} />
          <Row label="이메일" value={user?.email} />
          <Row label="전화" value={user?.phone ?? undefined} />
          <Row label="가입일" value={user ? formatDate(user.createdAt) : undefined} />
        </dl>
      </section>

      <section className="card space-y-2 p-6">
        <h2 className="mb-2 text-sm font-semibold">알림 설정</h2>
        <Toggle
          label="신규 발주 알림"
          desc="요청됨 상태의 발주가 접수되면 알림"
          checked={prefs.newOrder}
          onChange={(v) => setPrefs({ ...prefs, newOrder: v })}
        />
        <Toggle
          label="게시판 신규 글 알림"
          desc="Q&A·건의 글이 등록되면 알림"
          checked={prefs.newPost}
          onChange={(v) => setPrefs({ ...prefs, newPost: v })}
        />
        <Toggle
          label="주간 미수금 다이제스트"
          desc="매주 월요일 오전 9시 발송"
          checked={prefs.outstandingDigest}
          onChange={(v) => setPrefs({ ...prefs, outstandingDigest: v })}
        />
      </section>

      <section className="card p-6">
        <button
          onClick={() => {
            logout();
            location.reload();
          }}
          className="btn-ghost w-full text-rose-600"
        >
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
      className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-2 text-left hover:bg-canvas"
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
