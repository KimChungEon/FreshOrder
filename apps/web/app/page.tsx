"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/store/auth";
import { LoadingBlock } from "../components/States";

export default function RootPage() {
  const router = useRouter();
  const { user, hydrated } = useAuth();

  useEffect(() => {
    if (!hydrated) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [hydrated, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingBlock />
    </div>
  );
}
