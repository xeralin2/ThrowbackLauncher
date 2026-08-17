import type { ReactNode } from "react";

export const panel = "rounded-lg border border-border bg-surface";

export const card = `${panel} flex flex-col gap-4 p-4`;

export const fieldRow =
  "flex items-center justify-between gap-3 rounded-md border bg-surface-2 p-2";

export const inputClasses =
  "h-8 min-w-0 rounded-md border border-border bg-surface-2 px-[0.4rem] font-mono text-ui text-text outline-none placeholder:text-text-muted focus:border-action";

export function ListRow({
  label,
  title,
  children,
}: {
  label: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={`${fieldRow} border-border`}>
      <span
        title={title}
        className="min-w-0 grow truncate-fade font-mono text-label text-text"
      >
        {label}
      </span>
      {children}
    </div>
  );
}
