"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { api } from "@freshorder/shared";
import type { PostType } from "@freshorder/shared";
import { PageHeader } from "../../../components/PageHeader";
import { PostTypeBadge } from "../../../components/StatusBadge";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
} from "../../../components/States";
import { formatDate } from "../../../lib/format";
import { ChevronRightIcon, PinIcon, PlusIcon } from "../../../components/icons";

type Tab = "all" | PostType;

const TABS: { value: Tab; label: string }[] = [
  { value: "all",        label: "전체" },
  { value: "notice",     label: "공지" },
  { value: "qna",        label: "Q&A" },
  { value: "suggestion", label: "건의" },
];

export default function BoardPage() {
  const [tab, setTab] = useState<Tab>("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["posts"],
    queryFn: () => api.listPosts(),
  });

  const filtered =
    tab === "all" ? data ?? [] : (data ?? []).filter((p) => p.type === tab);

  return (
    <div className="space-y-4">
      <PageHeader
        title="게시판"
        subtitle="공지사항과 Q&A, 건의사항을 확인하세요"
        action={
          <Link href="/board/new" className="btn-primary">
            <PlusIcon className="mr-1" /> 글 작성
          </Link>
        }
      />

      <div className="-mx-1 flex gap-1.5 px-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={clsx(
              "tab",
              tab === t.value ? "tab-active" : "tab-inactive",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : isError ? (
        <ErrorBlock onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyBlock title="등록된 글이 없습니다" />
      ) : (
        <ul className="card divide-y divide-line">
          {filtered.map((p) => (
            <li key={p.id}>
              <Link
                href={`/board/${p.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {p.pinned && (
                      <PinIcon className="text-primary" width={14} height={14} />
                    )}
                    <PostTypeBadge type={p.type} />
                    <p className="truncate text-sm font-semibold">{p.title}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {p.authorName} · {formatDate(p.createdAt)} · 조회 {p.views}
                  </p>
                </div>
                <ChevronRightIcon className="text-ink-subtle" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
