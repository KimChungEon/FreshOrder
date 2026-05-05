"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/store/auth";
import { Spinner } from "../../components/States";

export default function LoginPage() {
  const router = useRouter();
  const loginAsMockOwner = useAuth((s) => s.loginAsMockOwner);
  const [id, setId] = useState("jungja");
  const [pw, setPw] = useState("freshorder");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(undefined);
    try {
      await loginAsMockOwner();
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-2xl font-extrabold text-primary">FreshOrder</div>
          <p className="mt-1 text-sm text-ink-muted">
            프랜차이즈 식재료 발주 서비스
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="card space-y-4 p-6"
          aria-label="로그인"
        >
          <div>
            <label className="label" htmlFor="loginId">
              아이디
            </label>
            <input
              id="loginId"
              className="input"
              value={id}
              onChange={(e) => setId(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label" htmlFor="loginPw">
              비밀번호
            </label>
            <input
              id="loginPw"
              type="password"
              className="input"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? <Spinner className="h-4 w-4 border-white" /> : "로그인"}
          </button>

          <p className="text-center text-[11px] text-ink-subtle">
            데모 모드: 입력 값과 무관하게 정자점 업주로 로그인됩니다.
          </p>
        </form>

        <div className="mt-4 text-center text-sm text-ink-muted">
          아직 계정이 없으신가요?{" "}
          <Link href="/signup" className="font-semibold text-primary">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
