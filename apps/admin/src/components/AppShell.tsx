import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useAuth } from "../lib/store/auth";
import { LoadingBlock } from "./States";

export function AppShell() {
  const { user, loading, loginAsAdmin } = useAuth();

  useEffect(() => {
    if (!user && !loading) loginAsAdmin();
  }, [user, loading, loginAsAdmin]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingBlock label="관리자 세션 준비 중…" />
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
