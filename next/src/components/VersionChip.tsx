export const valueChip =
  "rounded-md border border-border bg-surface-2 p-[0.2rem] font-mono text-[0.72rem] text-text-muted";

export function VersionChip({
  version,
  className = "",
}: {
  version: string;
  className?: string;
}) {
  return (
    <code className={`${valueChip} ${className}`}>
      v{version.replace(/^v/, "")}
    </code>
  );
}
