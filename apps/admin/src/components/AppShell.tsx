import { Navigate, Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useAuth } from "../lib/store/auth";
import { LoadingBlock } from "./States";

export function AppShell() {
  const { user, hydrated } = useAuth();

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingBlock label="세션 확인 중…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card w-full max-w-sm space-y-3 p-6 text-center">
          <p className="text-base font-semibold">권한이 없습니다</p>
          <p className="text-sm text-ink-muted">
            본사 관리자(ADMIN) 계정으로만 접근할 수 있습니다.
          </p>
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => useAuth.getState().logout()}
          >
            다른 계정으로 로그인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
