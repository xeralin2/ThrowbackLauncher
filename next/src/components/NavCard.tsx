import Link from "next/link";
import type { ReactNode } from "react";

export function CardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="card-grid grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-4 max-[48em]:grid-cols-2 max-[32.5em]:grid-cols-1">
      {children}
    </div>
  );
}

export function NavCard({
  href,
  title,
  desc,
  arrow,
}: {
  href: string;
  title: ReactNode;
  desc: ReactNode;
  arrow: string;
}) {
  return (
    <Link
      href={href}
      className="nav-card group relative flex flex-col gap-2 overflow-hidden rounded-lg border border-border bg-surface p-5 text-text no-underline transition-[border-color,background-color,box-shadow] duration-200 hover:bg-surface-2 card-glow-hover card-line-hover"
    >
      <h3 className="font-display text-[1.05rem] font-bold text-text">
        {title}
      </h3>
      <div className="flex-1 text-[0.82rem] leading-[1.5] text-text-muted">
        {desc}
      </div>
      <div className="mt-auto font-mono text-[0.7rem] tracking-[0.1em] text-action">
        {arrow}
      </div>
    </Link>
  );
}
