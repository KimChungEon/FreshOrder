"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BottomTabBar } from "./BottomTabBar";
import { useAuth } from "../lib/store/auth";
import { LoadingBlock } from "./States";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, hydrated } = useAuth();

  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingBlock label="세션 확인 중…" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-4 md:max-w-5xl md:px-6 md:pb-10">
          {children}
        </main>
        <BottomTabBar />
      </div>
    </div>
  );
}
