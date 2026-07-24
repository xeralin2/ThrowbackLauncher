import type { ButtonHTMLAttributes, ReactNode } from "react";

export const buttonBase =
  "inline-flex items-center gap-2 whitespace-nowrap rounded-md px-[1.1rem] font-mono text-[0.75rem] tracking-[0.08em] shadow-[0_2px_14px_transparent] transition duration-200";

export const buttonVariants = {
  primary:
    "bg-action py-[0.55rem] text-action-text hover:bg-action-deep hover:shadow-[0_2px_14px_var(--color-action-glow)]",
  secondary:
    "border border-border bg-surface-2 py-[calc(0.55rem-1px)] text-text-muted hover:bg-border hover:text-text hover:shadow-[0_2px_14px_var(--color-action-glow)]",
};

export const iconButton =
  "p-1 text-text-muted transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-40";

export const iconButtonDanger =
  "p-1 text-text-muted transition-colors hover:text-brand-bright disabled:cursor-not-allowed disabled:opacity-40";

const base = `${buttonBase} justify-center disabled:cursor-not-allowed disabled:opacity-40`;

export function Button({
  variant = "secondary",
  className = "",
  children,
  ...props
}: {
  variant?: "primary" | "secondary";
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${base} ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
