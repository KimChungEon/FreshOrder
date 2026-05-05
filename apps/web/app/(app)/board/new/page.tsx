"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { api } from "@freshorder/shared";
import type { PostType } from "@freshorder/shared";
import { useAuth } from "../../../../lib/store/auth";
import { PageHeader } from "../../../../components/PageHeader";
import { Spinner } from "../../../../components/States";

const TYPES: { value: PostType; label: string }[] = [
  { value: "qna",        label: "Q&A" },
  { value: "suggestion", label: "건의" },
  { value: "notice",     label: "공지" },
];

export default function NewPostPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);

  const [type, setType] = useState<PostType>("qna");
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
      router.replace(`/board/${post.id}`);
    },
  });

  const canSubmit =
    title.trim().length > 0 && content.trim().length > 0 && !create.isPending;

  return (
    <div className="space-y-4">
      <PageHeader title="글 작성" subtitle="궁금한 점이나 의견을 남겨주세요" />

      <div className="card space-y-4 p-4">
        <div>
          <span className="label">분류</span>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={clsx(
                  "rounded-xl border px-3 py-2 text-sm font-medium",
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
            rows={8}
            className="input resize-none"
            placeholder="내용을 입력하세요"
          />
        </div>

        {create.isError && (
          <p className="text-sm text-rose-600">등록 중 오류가 발생했습니다.</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-ghost"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => create.mutate()}
            className="btn-primary min-w-24"
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
