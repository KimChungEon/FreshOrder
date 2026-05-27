"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "../../lib/store/auth";
import { Spinner } from "../../components/States";
import { Logo } from "../../components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState("gangnam@freshorder.com");
  const [pw, setPw] = useState("password123");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(undefined);
    try {
      await login(email, pw);
      router.replace("/dashboard");
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data
          ? (err.response.data as { error?: { message?: string } }).error?.message ??
            "로그인 실패"
          : err instanceof Error
            ? err.message
            : "로그인 실패";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <Logo variant="horizontal" className="h-12 w-auto" />
          <p className="mt-2 text-sm text-ink-muted">
            프랜차이즈 식재료 발주 서비스
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="card space-y-4 p-6"
          aria-label="로그인"
        >
          <div>
            <label className="label" htmlFor="loginEmail">
              이메일
            </label>
            <input
              id="loginEmail"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
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
              required
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
            테스트 계정: gangnam@freshorder.com / password123
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
