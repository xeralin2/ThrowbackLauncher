import type { ReactNode } from "react";
import { linkClasses } from "./Callout";

const VARIANTS = {
  notice:
    "border-l-accent bg-notice-bg text-notice-text [&_code]:border-notice-border [&_code]:bg-notice-bg-strong [&_code]:text-notice-code",
  warning:
    "border-l-brand bg-warning-bg text-warning-text [&_code]:border-warning-border [&_code]:bg-warning-bg-strong [&_code]:text-warning-code",
};

export function Note({
  children,
  variant = "notice",
  className = "",
}: {
  children: ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  return (
    <div
      className={`w-fit rounded-r-[4px] border-l-[3px] px-[0.9rem] py-[0.6rem] text-[0.83rem] leading-[1.5] ${VARIANTS[variant]} ${linkClasses} [&_strong]:font-semibold [&_strong]:text-inherit ${className}`}
    >
      {children}
    </div>
  );
}
