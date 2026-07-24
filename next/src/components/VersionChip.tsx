export function VersionChip({
  version,
  className = "",
}: {
  version: string;
  className?: string;
}) {
  return (
    <code
      className={`rounded-[4px] border border-border bg-surface-2 px-[0.45em] py-[0.15em] font-mono text-[0.72rem] text-text-muted ${className}`}
    >
      v{version.replace(/^v/, "")}
    </code>
  );
}
