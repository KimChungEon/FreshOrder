import type { ReactNode } from "react";
import clsx from "clsx";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent",
        className,
      )}
    />
  );
}

export function LoadingBlock({ label = "불러오는 중…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-ink-muted">
      <Spinner />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorBlock({
  message = "데이터를 불러오지 못했습니다.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
      <p className="text-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-soft">
          다시 시도
        </button>
      )}
    </div>
  );
}

export function EmptyBlock({
  title = "표시할 항목이 없습니다",
  hint,
  action,
}: {
  title?: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-white py-12 text-center">
      <p className="text-sm font-semibold">{title}</p>
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
