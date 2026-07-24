export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  const on =
    "border-action bg-action" + (disabled ? "" : " group-hover:bg-action-deep");
  const off =
    "border-border bg-surface-2" + (disabled ? "" : " group-hover:bg-border");
  const knobOff =
    "origin-left translate-x-0 bg-text-muted" +
    (disabled ? "" : " group-hover:bg-text");
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        className={`relative h-[18px] w-[34px] flex-shrink-0 rounded-md border transition-colors duration-200 ${
          checked ? on : off
        }`}
      >
        <span
          className={`absolute left-[2px] top-1/2 h-[12px] w-[12px] -translate-y-1/2 rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.45)] transition-[translate,scale,background-color] duration-200 ease-out group-active:scale-x-[1.25] ${
            checked ? "origin-right translate-x-[16px] bg-action-text" : knobOff
          }`}
        />
      </span>
    </button>
  );
}
