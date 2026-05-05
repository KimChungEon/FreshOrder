"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";

type Role = "owner" | "admin";

export default function SignupPage() {
  const [role, setRole] = useState<Role>("owner");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-2xl font-extrabold text-primary">회원가입</div>
          <p className="mt-1 text-sm text-ink-muted">
            본사 발급 초대코드가 필요합니다
          </p>
        </div>

        {submitted ? (
          <div className="card space-y-3 p-6 text-center">
            <p className="font-semibold">가입 신청이 접수되었습니다</p>
            <p className="text-sm text-ink-muted">
              본사 운영팀 검토 후 1영업일 내 안내드립니다.
            </p>
            <Link href="/login" className="btn-primary mt-2 w-full">
              로그인 화면으로
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="card space-y-4 p-6">
            <div>
              <span className="label">역할 선택</span>
              <div className="grid grid-cols-2 gap-2">
                {(["owner", "admin"] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={clsx(
                      "rounded-xl border px-3 py-2 text-sm font-medium",
                      role === r
                        ? "border-primary bg-primary-50 text-primary-700"
                        : "border-line bg-white text-ink-muted",
                    )}
                  >
                    {r === "owner" ? "직영점 업주" : "본사 관리자"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="invite">
                초대코드
              </label>
              <input
                id="invite"
                className="input"
                placeholder="예: FO-INVITE-2026"
              />
            </div>
            <div>
              <label className="label" htmlFor="name">
                이름
              </label>
              <input id="name" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="email">
                이메일
              </label>
              <input id="email" type="email" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="phone">
                휴대전화
              </label>
              <input id="phone" className="input" placeholder="010-0000-0000" />
            </div>
            {role === "owner" && (
              <div>
                <label className="label" htmlFor="store">
                  매장명
                </label>
                <input id="store" className="input" placeholder="예: 정자점" />
              </div>
            )}
            <div>
              <label className="label" htmlFor="pw">
                비밀번호
              </label>
              <input id="pw" type="password" className="input" />
            </div>

            <button type="submit" className="btn-primary w-full">
              가입 신청
            </button>

            <p className="text-center text-[11px] text-ink-subtle">
              데모 모드: 실제 가입은 처리되지 않습니다.
            </p>
          </form>
        )}

        <div className="mt-4 text-center text-sm text-ink-muted">
          이미 계정이 있나요?{" "}
          <Link href="/login" className="font-semibold text-primary">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
