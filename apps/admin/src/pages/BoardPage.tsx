import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { api } from "@freshorder/shared";
import type { PostType } from "@freshorder/shared";
import { PageHeader } from "../components/PageHeader";
import { PostTypeBadge } from "../components/StatusBadge";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
} from "../components/States";
import { formatDate } from "../lib/format";
import { PlusIcon } from "../components/icons";

type Tab = "all" | PostType;
const TABS: { value: Tab; label: string }[] = [
  { value: "all",        label: "전체" },
  { value: "notice",     label: "공지" },
  { value: "qna",        label: "Q&A" },
  { value: "suggestion", label: "건의" },
];

export default function BoardPage() {
  const [tab, setTab] = useState<Tab>("all");

  const posts = useQuery({
    queryKey: ["posts"],
    queryFn: () => api.listPosts(),
  });
  const comments = useQuery({
    queryKey: ["all-comments"],
    queryFn: async () => {
      // 답변 여부 표시를 위해 게시글별 댓글 수를 일괄 조회
      const list = await api.listPosts();
      const all = await Promise.all(
        list.map((p) =>
          api.getCommentsByPost(p.id).then((cs) => ({ postId: p.id, count: cs.length })),
        ),
      );
      return Object.fromEntries(all.map((x) => [x.postId, x.count]));
    },
  });

  if (posts.isLoading) return <LoadingBlock />;
  if (posts.isError) return <ErrorBlock onRetry={posts.refetch} />;

  const filtered =
    tab === "all"
      ? posts.data ?? []
      : (posts.data ?? []).filter((p) => p.type === tab);

  return (
    <div className="space-y-5">
      <PageHeader
        title="게시판 관리"
        subtitle="공지 작성과 Q&A·건의 답변을 관리합니다"
        action={
          <Link to="/board/new" className="btn-primary">
            <PlusIcon width={16} height={16} className="mr-1" /> 글 작성
          </Link>
        }
      />

      <div className="flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={clsx(
              "rounded-full px-3.5 py-1.5 text-xs font-medium",
              tab === t.value
                ? "bg-primary text-white"
                : "bg-canvas text-ink-muted hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyBlock title="등록된 글이 없습니다" />
      ) : (
        <section className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-canvas">
              <tr>
                <th className="th">분류</th>
                <th className="th">제목</th>
                <th className="th">작성자</th>
                <th className="th text-right">조회</th>
                <th className="th text-right">답변</th>
                <th className="th">작성일</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const cnt = comments.data?.[p.id] ?? 0;
                const needsReply = p.type !== "notice" && cnt === 0;
                return (
                  <tr key={p.id} className="border-t border-line">
                    <td className="td">
                      <PostTypeBadge type={p.type} />
                      {p.pinned && (
                        <span className="ml-1 text-[10px] text-primary">
                          고정
                        </span>
                      )}
                    </td>
                    <td className="td">
                      <Link
                        to={`/board/${p.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {p.title}
                      </Link>
                    </td>
                    <td className="td text-ink-muted">{p.authorName}</td>
                    <td className="td text-right text-ink-muted">{p.views}</td>
                    <td className="td text-right">
                      {needsReply ? (
                        <span className="chip bg-amber-100 text-amber-800">
                          답변 필요
                        </span>
                      ) : (
                        <span className="text-ink-muted">{cnt}건</span>
                      )}
                    </td>
                    <td className="td text-ink-muted">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="td text-right">
                      <Link to={`/board/${p.id}`} className="btn-ghost text-xs">
                        상세
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
