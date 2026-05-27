import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@freshorder/shared";
import { PageHeader } from "../components/PageHeader";
import { PostTypeBadge } from "../components/StatusBadge";
import {
  ErrorBlock,
  LoadingBlock,
  Spinner,
} from "../components/States";
import { formatDateTime } from "../lib/format";

export default function BoardDetailPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const [reply, setReply] = useState("");

  const post = useQuery({
    queryKey: ["post", id],
    queryFn: () => api.getPostDetail(id),
    enabled: !!id,
  });

  const create = useMutation({
    mutationFn: () => api.createComment(id, reply.trim()),
    onSuccess: () => {
      setReply("");
      qc.invalidateQueries({ queryKey: ["post", id] });
      qc.invalidateQueries({ queryKey: ["posts"] });
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
        <Link to="/board" className="btn-ghost">
          ← 목록
        </Link>
      </div>
    );
  }

  const p = post.data;
  const comments = p.comments ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title="게시글" />

      <article className="card space-y-3 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <PostTypeBadge type={p.boardType} />
          {p.isPinned && (
            <span className="chip bg-primary-50 text-primary-700">고정</span>
          )}
          <h2 className="text-lg font-bold">{p.title}</h2>
        </div>
        <p className="text-xs text-ink-muted">
          {p.author?.name ?? "-"} · {formatDateTime(p.createdAt)} · 조회 {p.viewCount}
        </p>
        <div className="whitespace-pre-wrap pt-2 text-sm leading-relaxed">
          {p.content}
        </div>
      </article>

      <section className="card overflow-hidden">
        <div className="border-b border-line px-5 py-3 text-sm font-semibold">
          답변 / 댓글 ({comments.length})
        </div>
        {comments.length > 0 ? (
          <ul className="divide-y divide-line">
            {comments.map((c) => (
              <li key={c.id} className="px-5 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {c.author?.name ?? "-"}
                    {c.author?.role === "ADMIN" && (
                      <span className="ml-1 chip bg-primary-50 text-primary-700">
                        본사
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-ink-subtle">
                    {formatDateTime(c.createdAt)}
                  </p>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{c.content}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-6 text-center text-sm text-ink-muted">
            아직 답변이 없습니다
          </p>
        )}

        <div className="border-t border-line bg-canvas/40 p-4">
          <p className="label">관리자 답변</p>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            className="input resize-none"
            placeholder="답변을 입력하세요"
          />
          <div className="mt-2 flex justify-end">
            <button
              disabled={!reply.trim() || create.isPending}
              onClick={() => create.mutate()}
              className="btn-primary min-w-20"
            >
              {create.isPending ? (
                <Spinner className="h-4 w-4 border-white" />
              ) : (
                "답변 등록"
              )}
            </button>
          </div>
        </div>
      </section>

      <div>
        <Link to="/board" className="btn-ghost">
          ← 목록
        </Link>
      </div>
    </div>
  );
}
