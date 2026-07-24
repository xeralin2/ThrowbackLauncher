import type { ReactNode } from "react";

export function SectionTitle({
  children,
  className = "mt-8",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`mb-4 ${className} flex items-center gap-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-text-muted after:h-px after:flex-1 after:origin-left after:animate-scale-in-x after:bg-border after:[animation-delay:0.15s] after:content-['']`}
    >
      {children}
    </h2>
  );
}
