import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { api } from "@freshorder/shared";
import type { BoardType } from "@freshorder/shared";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/States";

const TYPES: { value: BoardType; label: string }[] = [
  { value: "NOTICE",     label: "공지" },
  { value: "QNA",        label: "Q&A" },
  { value: "SUGGESTION", label: "건의" },
];

export default function BoardNewPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [boardType, setBoardType] = useState<BoardType>("NOTICE");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const create = useMutation({
    mutationFn: () =>
      api.createPost({
        boardType,
        title: title.trim(),
        content: content.trim(),
        isPinned: boardType === "NOTICE" ? isPinned : false,
      }),
    onSuccess: (post) => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      navigate(`/board/${post.id}`, { replace: true });
    },
  });

  const canSubmit =
    title.trim().length > 0 && content.trim().length > 0 && !create.isPending;

  return (
    <div className="space-y-5">
      <PageHeader
        title="글 작성"
        subtitle="공지사항을 등록하거나 직영점 Q&A에 응답합니다"
      />

      <div className="card space-y-4 p-5">
        <div>
          <span className="label">분류</span>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setBoardType(t.value)}
                className={clsx(
                  "rounded-lg border px-3 py-2 text-sm font-medium",
                  boardType === t.value
                    ? "border-primary bg-primary-50 text-primary-700"
                    : "border-line bg-white text-ink-muted",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {boardType === "NOTICE" && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
            />
            상단 고정
          </label>
        )}

        <div>
          <label htmlFor="title" className="label">
            제목
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="제목을 입력하세요"
          />
        </div>

        <div>
          <label htmlFor="content" className="label">
            내용
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="input resize-none"
            placeholder="내용을 입력하세요"
          />
        </div>

        {create.isError && (
          <p className="text-sm text-rose-600">등록 중 오류가 발생했습니다.</p>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={() => navigate(-1)} className="btn-ghost">
            취소
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => create.mutate()}
            className="btn-primary min-w-20"
          >
            {create.isPending ? (
              <Spinner className="h-4 w-4 border-white" />
            ) : (
              "등록"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
