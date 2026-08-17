import type { ReactNode } from "react";

type TagVariant = "default" | "amber";

function sizeClasses(size: "sm" | "md") {
  return `whitespace-nowrap rounded-md border p-[0.2rem] font-mono ${
    size === "md" ? "text-label" : "text-[0.6rem]"
  }`;
}

export function Tag({
  variant = "default",
  size = "sm",
  children,
}: {
  variant?: TagVariant;
  size?: "sm" | "md";
  children: ReactNode;
}) {
  if (variant === "default")
    return (
      <span
        className={`${sizeClasses(size)} border-border bg-surface-2 text-text-muted`}
      >
        {children}
      </span>
    );
  const colors = SPLIT_COLORS[variant];
  return (
    <span
      className={sizeClasses(size)}
      style={{
        color: colors.text,
        borderColor: colors.border,
        background: colors.bg,
      }}
    >
      {children}
    </span>
  );
}

const SPLIT_COLORS: Record<
  "brand" | "amber" | "purple" | "steel",
  { text: string; border: string; bg: string }
> = {
  brand: {
    text: "var(--color-brand-bright)",
    border: "var(--color-border-brand)",
    bg: "var(--color-tag-brand-bg)",
  },
  amber: {
    text: "var(--color-amber)",
    border: "var(--color-notice-border)",
    bg: "var(--color-notice-bg-strong)",
  },
  purple: {
    text: "var(--color-purple)",
    border: "var(--color-tag-purple-border)",
    bg: "var(--color-tag-purple-bg)",
  },
  steel: {
    text: "var(--color-steel)",
    border: "var(--color-tag-steel-border)",
    bg: "var(--color-tag-steel-bg)",
  },
};

export function SplitTag({
  left,
  right,
  variant,
}: {
  left: ReactNode;
  right: ReactNode;
  variant: "brand" | "amber" | "purple" | "steel";
}) {
  const colors = SPLIT_COLORS[variant];
  return (
    <span
      className={`inline-flex items-center gap-[0.55em] border-transparent ${sizeClasses("md")}`}
      style={{
        background: `linear-gradient(to right, var(--color-surface-2), ${colors.bg}) padding-box, linear-gradient(to right, var(--color-border), ${colors.border}) border-box`,
      }}
    >
      <span className="text-text-muted">{left}</span>
      <span style={{ color: colors.text }}>{right}</span>
    </span>
  );
}
