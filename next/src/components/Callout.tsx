import type { ReactNode } from "react";

type CalloutProps = {
  variant?: "notice" | "warning";
  label: string;
  children: ReactNode;
  className?: string;
};

export const linkClasses =
  "[&_a]:text-notice-link [&_a]:underline [&_a:hover]:text-notice-link-hover [&_code]:rounded-[4px] [&_code]:border [&_code]:px-[0.4em] [&_code]:py-[0.1em] [&_code]:font-mono [&_code]:text-[0.85em]";

const variantClasses: Record<
  NonNullable<CalloutProps["variant"]>,
  { box: string; label: string }
> = {
  notice: {
    box: "animate-notice-pulse border-notice-border border-l-[3px] border-l-accent bg-notice-bg text-notice-text [&_code]:border-notice-border [&_code]:bg-notice-bg-strong [&_code]:text-notice-code",
    label: "text-accent",
  },
  warning: {
    box: "animate-warning-pulse border-warning-border border-l-[3px] border-l-brand bg-warning-bg text-warning-text [&_code]:border-warning-border [&_code]:bg-warning-bg-strong [&_code]:text-warning-code",
    label: "text-brand",
  },
};

export function Callout({
  variant = "notice",
  label,
  children,
  className = "mb-6",
}: CalloutProps) {
  const styles = variantClasses[variant];
  return (
    <div
      className={`${className} rounded-md border px-[1.1rem] py-[0.9rem] text-[0.85rem] leading-[1.5] ${linkClasses} ${styles.box}`}
    >
      <strong
        className={`mb-[0.3rem] block font-mono text-[0.72rem] tracking-[0.1em] ${styles.label}`}
      >
        {label}
      </strong>
      {children}
    </div>
  );
}
