import clsx from "clsx";

type Variant = "horizontal" | "icon" | "white";

type Props = {
  variant?: Variant;
  className?: string;
  title?: string;
};

const ICON_PATHS = (
  <>
    <path
      d="M10 28 L32 22 L54 28 L54 50 Q54 54 50 54 L14 54 Q10 54 10 50 Z"
      fill="currentColor"
    />
    <path
      d="M10 28 L32 34 L54 28"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="1.5"
      opacity="0.45"
    />
    <rect x="27" y="29" width="10" height="3" rx="1.5" fill="#FFFFFF" opacity="0.7" />
    <path
      d="M32 22 C 32 12, 24 6, 16 12 C 18 20, 26 22, 32 22 Z"
      fill="#22C55E"
    />
    <path
      d="M32 22 C 32 14, 40 10, 48 14 C 44 20, 36 22, 32 22 Z"
      fill="#34D399"
    />
    <line
      x1="32"
      y1="22"
      x2="32"
      y2="14"
      stroke="#15803D"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </>
);

export function Logo({ variant = "horizontal", className, title = "FreshOrder" }: Props) {
  if (variant === "icon") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        role="img"
        aria-label={title}
        className={clsx("text-primary", className)}
      >
        <title>{title}</title>
        {ICON_PATHS}
      </svg>
    );
  }

  const isWhite = variant === "white";
  const textFill = isWhite ? "#FFFFFF" : "#185FA5";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 64"
      role="img"
      aria-label={title}
      className={clsx(isWhite ? "text-white" : "text-primary", className)}
    >
      <title>{title}</title>
      {isWhite ? (
        <g fill="#FFFFFF">
          <path
            d="M10 28 L32 22 L54 28 L54 50 Q54 54 50 54 L14 54 Q10 54 10 50 Z"
            opacity="0.95"
          />
          <path
            d="M10 28 L32 34 L54 28"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <rect x="27" y="29" width="10" height="3" rx="1.5" opacity="0.6" />
          <path
            d="M32 22 C 32 12, 24 6, 16 12 C 18 20, 26 22, 32 22 Z"
            opacity="0.85"
          />
          <path
            d="M32 22 C 32 14, 40 10, 48 14 C 44 20, 36 22, 32 22 Z"
            opacity="0.7"
          />
          <line
            x1="32"
            y1="22"
            x2="32"
            y2="14"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      ) : (
        ICON_PATHS
      )}
      <text
        x="68"
        y="42"
        fontFamily="Pretendard, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        fontSize="22"
        fontWeight="800"
        fill={textFill}
        letterSpacing="-0.5"
      >
        프레시오더
      </text>
    </svg>
  );
}
