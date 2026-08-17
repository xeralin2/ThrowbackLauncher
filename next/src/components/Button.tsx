import type { ButtonHTMLAttributes, ReactNode } from "react";

export const buttonBase =
  "inline-flex h-8 items-center whitespace-nowrap rounded-md px-[1.1rem] font-mono text-label tracking-[0.08em] shadow-[0_2px_14px_transparent] transition duration-200";

export const buttonVariants = {
  primary:
    "bg-action text-action-text not-disabled:hover:bg-action-deep not-disabled:hover:shadow-[0_2px_14px_var(--color-action-glow)]",
  secondary:
    "border border-border bg-surface-2 text-text-muted not-disabled:hover:bg-border not-disabled:hover:text-text not-disabled:hover:shadow-[0_2px_14px_var(--color-action-glow)]",
};

export const iconButton =
  "p-1 text-text-muted transition-colors enabled:hover:text-text disabled:cursor-not-allowed disabled:opacity-40";

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
