"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { breadcrumbFor, normalizePath, resolveCrumbHref } from "@/config/nav";
import { useHasLocalSeasons } from "@/lib/bridge";
import { useDetail } from "@/lib/detail";

const linkClass =
  "cursor-pointer no-underline transition-colors hover:text-text";

export function Topbar() {
  const pathname = normalizePath(usePathname());
  const base = breadcrumbFor(pathname);
  const { detail } = useDetail();
  const hasLocal = useHasLocalSeasons();
  const lastIndex = base.length - 1;

  return (
    <div className="sticky top-0 z-50 flex h-[var(--topbar-h)] items-center border-b border-border bg-surface px-8 max-[56.25em]:pl-14 max-[56.25em]:pr-4">
      <div className="min-w-0 grow truncate-fade font-mono text-[0.75rem] tracking-[0.04em] text-text-muted">
        {base.map((crumb, index) => {
          if (index === lastIndex) {
            return detail ? (
              <span key={index}>
                <button
                  type="button"
                  onClick={detail.reset}
                  className={linkClass}
                >
                  {crumb.label}
                </button>
                {" / "}
              </span>
            ) : (
              <span key={index} className="text-text">
                {crumb.label}
              </span>
            );
          }
          const destination = resolveCrumbHref(crumb.href, hasLocal);
          return (
            <span key={index}>
              <Link
                href={destination}
                onClick={(event) => {
                  if (detail && destination === pathname) {
                    event.preventDefault();
                    detail.reset();
                  }
                }}
                className={linkClass}
              >
                {crumb.label}
              </Link>
              {" / "}
            </span>
          );
        })}
        {detail && <span className="text-text">{detail.label}</span>}
        <span className="ml-px inline-block animate-blink">_</span>
      </div>
      <div id="topbar-actions" className="flex min-w-0 items-center" />
    </div>
  );
}
