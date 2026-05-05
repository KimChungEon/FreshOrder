import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { api } from "@freshorder/shared";
import type { PostType } from "@freshorder/shared";
import { useAuth } from "../lib/store/auth";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/States";

const TYPES: { value: PostType; label: string }[] = [
  { value: "notice",     label: "공지" },
  { value: "qna",        label: "Q&A" },
  { value: "suggestion", label: "건의" },
];

export default function BoardNewPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);

  const [type, setType] = useState<PostType>("notice");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const create = useMutation({
    mutationFn: () =>
      api.createPost({
        type,
        title: title.trim(),
        content: content.trim(),
        authorId: user!.id,
        authorName: user!.name,
      }),
    onSuccess: (post) => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["all-comments"] });
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
                onClick={() => setType(t.value)}
                className={clsx(
                  "rounded-lg border px-3 py-2 text-sm font-medium",
                  type === t.value
                    ? "border-primary bg-primary-50 text-primary-700"
                    : "border-line bg-white text-ink-muted",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

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
