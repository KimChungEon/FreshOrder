import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { api } from "@freshorder/shared";
import type { BoardType } from "@freshorder/shared";
import { PageHeader } from "../components/PageHeader";
import { PostTypeBadge } from "../components/StatusBadge";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
} from "../components/States";
import { formatDate } from "../lib/format";
import { PlusIcon } from "../components/icons";

type Tab = "all" | BoardType;
const TABS: { value: Tab; label: string }[] = [
  { value: "all",        label: "전체" },
  { value: "NOTICE",     label: "공지" },
  { value: "QNA",        label: "Q&A" },
  { value: "SUGGESTION", label: "건의" },
];

export default function BoardPage() {
  const [tab, setTab] = useState<Tab>("all");

  const posts = useQuery({
    queryKey: ["posts", tab],
    queryFn: () =>
      api.getPosts(tab === "all" ? { limit: 100 } : { boardType: tab, limit: 100 }),
  });

  if (posts.isLoading) return <LoadingBlock />;
  if (posts.isError) return <ErrorBlock onRetry={posts.refetch} />;

  const items = posts.data?.items ?? [];

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

      {items.length === 0 ? (
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
              {items.map((p) => {
                const cnt = p._count?.comments ?? 0;
                const needsReply = p.boardType !== "NOTICE" && cnt === 0;
                return (
                  <tr key={p.id} className="border-t border-line">
                    <td className="td">
                      <PostTypeBadge type={p.boardType} />
                      {p.isPinned && (
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
                    <td className="td text-ink-muted">
                      {p.author?.name ?? "-"}
                    </td>
                    <td className="td text-right text-ink-muted">{p.viewCount}</td>
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
