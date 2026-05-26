"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../lib/store/auth";
import { Spinner } from "../../components/States";

export default function SignupPage() {
  const router = useRouter();
  const signup = useAuth((s) => s.signup);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    inviteCode: "",
    storeName: "",
    storeAddress: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(undefined);
    try {
      await signup({
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone || undefined,
        role: "STORE_OWNER",
        inviteCode: form.inviteCode || undefined,
        storeName: form.storeName || undefined,
        storeAddress: form.storeAddress || undefined,
      });
      router.replace("/dashboard");
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data
          ? (err.response.data as { error?: { message?: string } }).error?.message ??
            "가입 실패"
          : err instanceof Error
            ? err.message
            : "가입 실패";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-2xl font-extrabold text-primary">회원가입</div>
          <p className="mt-1 text-sm text-ink-muted">
            본사 발급 초대코드로 직영점주 가입
          </p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <div>
            <label className="label" htmlFor="invite">초대코드</label>
            <input id="invite" className="input" value={form.inviteCode} onChange={update("inviteCode")} placeholder="6자리" />
          </div>
          <div>
            <label className="label" htmlFor="name">이름</label>
            <input id="name" className="input" value={form.name} onChange={update("name")} required />
          </div>
          <div>
            <label className="label" htmlFor="email">이메일</label>
            <input id="email" type="email" className="input" value={form.email} onChange={update("email")} required />
          </div>
          <div>
            <label className="label" htmlFor="phone">휴대전화</label>
            <input id="phone" className="input" value={form.phone} onChange={update("phone")} placeholder="010-0000-0000" />
          </div>
          <div>
            <label className="label" htmlFor="store">매장명</label>
            <input id="store" className="input" value={form.storeName} onChange={update("storeName")} placeholder="예: 강남점" />
          </div>
          <div>
            <label className="label" htmlFor="addr">매장 주소</label>
            <input id="addr" className="input" value={form.storeAddress} onChange={update("storeAddress")} />
          </div>
          <div>
            <label className="label" htmlFor="pw">비밀번호</label>
            <input id="pw" type="password" className="input" value={form.password} onChange={update("password")} required minLength={8} />
          </div>

          {error && <p className="text-xs text-rose-600" role="alert">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? <Spinner className="h-4 w-4 border-white" /> : "가입 신청"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-ink-muted">
          이미 계정이 있나요?{" "}
          <Link href="/login" className="font-semibold text-primary">로그인</Link>
        </div>
      </div>
    </div>
  );
}
