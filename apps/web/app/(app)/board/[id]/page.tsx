"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@freshorder/shared";
import { PageHeader } from "../../../../components/PageHeader";
import { PostTypeBadge } from "../../../../components/StatusBadge";
import {
  ErrorBlock,
  LoadingBlock,
  Spinner,
} from "../../../../components/States";
import { formatDateTime } from "../../../../lib/format";
import { PinIcon } from "../../../../components/icons";

export default function PostDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const post = useQuery({
    queryKey: ["post", params.id],
    queryFn: () => api.getPostDetail(params.id),
  });

  const create = useMutation({
    mutationFn: () => api.createComment(params.id, comment.trim()),
    onSuccess: () => {
      setComment("");
      qc.invalidateQueries({ queryKey: ["post", params.id] });
    },
  });

  if (post.isLoading) return <LoadingBlock />;
  if (post.isError || !post.data) {
    return (
      <div className="space-y-3">
        <ErrorBlock
          message={post.isError ? undefined : "게시글을 찾을 수 없습니다."}
          onRetry={post.isError ? post.refetch : undefined}
        />
        <Link href="/board" className="btn-ghost">← 목록으로</Link>
      </div>
    );
  }

  const p = post.data;
  const comments = p.comments ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title="게시글" />

      <article className="card space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {p.isPinned && <PinIcon className="text-primary" width={16} height={16} />}
          <PostTypeBadge type={p.boardType} />
          <h2 className="text-base font-bold">{p.title}</h2>
        </div>
        <p className="text-xs text-ink-muted">
          {p.author?.name ?? "-"} · {formatDateTime(p.createdAt)} · 조회 {p.viewCount}
        </p>
        <div className="whitespace-pre-wrap pt-2 text-sm leading-relaxed">{p.content}</div>
      </article>

      <section className="card overflow-hidden">
        <div className="border-b border-line px-4 py-3 text-sm font-semibold">
          댓글 ({comments.length})
        </div>
        {comments.length > 0 ? (
          <ul className="divide-y divide-line">
            {comments.map((c) => (
              <li key={c.id} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {c.author?.name ?? "-"}
                    {c.author?.role === "ADMIN" && (
                      <span className="ml-1 chip bg-primary-50 text-primary-700">본사</span>
                    )}
                  </p>
                  <p className="text-[11px] text-ink-subtle">{formatDateTime(c.createdAt)}</p>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{c.content}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-center text-sm text-ink-muted">아직 댓글이 없습니다</p>
        )}

        <div className="border-t border-line bg-canvas/50 p-3">
          <div className="flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="댓글을 입력하세요"
              className="input flex-1 bg-white"
            />
            <button
              disabled={!comment.trim() || create.isPending}
              onClick={() => create.mutate()}
              className="btn-primary min-w-20"
            >
              {create.isPending ? <Spinner className="h-4 w-4 border-white" /> : "등록"}
            </button>
          </div>
        </div>
      </section>

      <div>
        <Link href="/board" className="btn-ghost">← 목록으로</Link>
      </div>
    </div>
  );
}
