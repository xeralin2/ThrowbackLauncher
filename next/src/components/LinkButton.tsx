import type { ReactNode } from "react";
import { buttonBase, buttonVariants } from "./Button";
import { ExternalLink } from "./ExternalLink";

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  download,
  children,
}: {
  href: string;
  variant?: "primary" | "secondary";
  download?: string;
  children: ReactNode;
}) {
  const className = `${buttonBase} ${buttonVariants[variant]} mb-[0.4rem] mr-2 no-underline`;
  if (download) {
    return (
      <a href={href} download={download} className={className}>
        {children}
      </a>
    );
  }
  return (
    <ExternalLink href={href} className={className}>
      {children}
      <ExternalIcon />
    </ExternalLink>
  );
}
