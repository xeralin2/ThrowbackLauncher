"use client";

import { useState, type ReactNode } from "react";
import {
  ACCENT_HUE_MAX,
  ACCENT_HUE_TRACK,
  ACCENT_STEP,
  accentHex,
  accentParts,
  applyAccent,
} from "@/config/accents";
import { iconButton } from "@/components/Button";
import { InfoHint } from "@/components/InfoHint";

export function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[2.75rem] items-center justify-between gap-4">
      <span className="flex items-center gap-1.5">
        <span className="font-display text-[1.05rem] font-bold text-text">
          {label}
        </span>
        {hint && <InfoHint text={hint} align="left" />}
      </span>
      {children}
    </div>
  );
}

export function SwatchPicker({
  label,
  colors,
  value,
  onSelect,
}: {
  label: string;
  colors: string[];
  value: string;
  onSelect: (color: string) => void;
}) {
  return (
    <span className="flex items-center">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`${label} ${color}`}
          aria-pressed={color === value}
          onClick={() => onSelect(color)}
          className="group flex h-7 w-7 items-center justify-center rounded-full focus-visible:outline-none"
        >
          <span
            style={{ backgroundColor: color }}
            className={`h-[18px] w-[18px] rounded-full transition group-focus-visible:outline group-focus-visible:-outline-offset-1 group-focus-visible:outline-2 group-focus-visible:outline-text ${
              color === value
                ? "ring-2 ring-text ring-offset-2 ring-offset-surface"
                : "opacity-55 group-hover:opacity-100"
            }`}
          />
        </button>
      ))}
    </span>
  );
}

export function SaveCheck({ confirm }: { confirm: number }) {
  const [initial] = useState(confirm);
  if (confirm <= initial) return null;
  return (
    <span
      key={confirm}
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-save-check h-4 w-4 text-success opacity-0"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

export function AccentPicker({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (hex: string) => void;
}) {
  const [draft, setDraft] = useState(() => accentParts(value));
  const [seen, setSeen] = useState(value);
  const [mine, setMine] = useState(value);
  if (seen !== value) {
    setSeen(value);
    if (value !== mine) setDraft(accentParts(value));
  }

  const preview = (next: { hue: number; level: number }) => {
    setDraft(next);
    applyAccent(accentHex(next.hue, next.level));
  };
  const commit = () => {
    const current = accentParts(value);
    if (draft.hue === current.hue && draft.level === current.level) return;
    const hex = accentHex(draft.hue, draft.level);
    setMine(hex);
    onCommit(hex);
  };
  const slider = "color-slider w-full min-w-0";

  return (
    <span className="flex w-[300px] shrink-0 flex-col gap-3">
      <input
        type="range"
        min={0}
        max={ACCENT_HUE_MAX}
        step={1}
        value={ACCENT_HUE_MAX - draft.hue}
        aria-label="Accent hue"
        onChange={(event) =>
          preview({
            ...draft,
            hue: ACCENT_HUE_MAX - Number(event.target.value),
          })
        }
        onPointerUp={commit}
        onKeyUp={commit}
        style={{ background: ACCENT_HUE_TRACK }}
        className={slider}
      />
      <input
        type="range"
        min={0}
        max={1}
        step={ACCENT_STEP}
        value={draft.level}
        aria-label="Accent intensity"
        onChange={(event) =>
          preview({ ...draft, level: Number(event.target.value) })
        }
        onPointerUp={commit}
        onKeyUp={commit}
        style={{
          background: `linear-gradient(to right, transparent, ${accentHex(
            draft.hue,
            1,
          )})`,
        }}
        className={slider}
      />
    </span>
  );
}

function StepIcon({ up }: { up: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d={up ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
    </svg>
  );
}

export function Stepper({
  label,
  value,
  min,
  max,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [prev, setPrev] = useState(value);
  const [sent, setSent] = useState<number | null>(null);
  if (prev !== value) {
    setPrev(value);
    if (sent === null) setDraft(String(value));
    else if (sent === value) setSent(null);
  }

  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  const parsed = Number.parseInt(draft, 10);
  const current = Number.isNaN(parsed) ? (sent ?? value) : clamp(parsed);
  const commit = (next: number) => {
    setDraft(String(next));
    if (next !== (sent ?? value)) {
      setSent(next);
      onCommit(next);
    }
  };

  return (
    <div className="flex items-center rounded-md border border-border bg-surface-2 px-1 py-0.5">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={current <= min}
        onClick={() => commit(clamp(current - 1))}
        className={iconButton}
      >
        <StepIcon up={false} />
      </button>
      <input
        value={draft}
        inputMode="numeric"
        aria-label={label}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => commit(current)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        className="w-[3.5ch] bg-transparent text-center font-mono text-ui text-text outline-none selection:bg-transparent"
      />
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={current >= max}
        onClick={() => commit(clamp(current + 1))}
        className={iconButton}
      >
        <StepIcon up={true} />
      </button>
    </div>
  );
}

export const inputClasses =
  "min-w-0 rounded-md border border-border bg-surface-2 px-3 py-[0.4rem] font-mono text-ui text-text outline-none placeholder:text-text-muted focus:border-action";

export function TextSetting({
  value,
  onCommit,
  className = "w-[230px]",
}: {
  value: string;
  onCommit: (value: string) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setDraft(value);
  }

  return (
    <input
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      className={`${className} ${inputClasses}`}
    />
  );
}
