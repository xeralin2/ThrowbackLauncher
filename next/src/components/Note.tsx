import type { ReactNode } from "react";

const linkClasses =
  "[&_a]:text-notice-link [&_a]:underline [&_a:hover]:text-notice-link-hover [&_code]:rounded-md [&_code]:border [&_code]:p-[0.15em] [&_code]:font-mono [&_code]:text-[0.85em]";

const noticeTone =
  "bg-notice-bg text-notice-text [&_code]:border-notice-border [&_code]:bg-notice-bg-strong [&_code]:text-notice-code";

export function Note({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-fit rounded-r-sm border-l-[3px] border-l-accent px-[0.4rem] py-[0.35rem] text-ui leading-[1.5] ${noticeTone} ${linkClasses} [&_strong]:font-semibold [&_strong]:text-inherit ${className}`}
    >
      {children}
    </div>
  );
}
