export function BackHeading({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <h1 className="mb-4 font-display text-[1.9rem] font-bold text-text">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="group flex w-fit items-center"
      >
        <svg
          viewBox="0 0 24 24"
          className="-ml-2 h-6 w-6 shrink-0 -translate-y-[1.5px] text-text-muted transition-colors group-hover:text-text"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 6 9 12 15 18" />
        </svg>
        <span>{title}</span>
      </button>
    </h1>
  );
}
