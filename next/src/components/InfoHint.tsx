"use client";

import { useEffect, useRef, useState } from "react";

const OPEN_DELAY = 400;
const CLOSE_DELAY = 100;

export function InfoHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        setPinned(false);
      }
    }
    window.addEventListener("mousedown", onDown);

    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function schedule(next: boolean, delay: number) {
    if (pinned) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(next), delay);
  }

  function toggle() {
    if (timer.current) clearTimeout(timer.current);
    setPinned(!pinned);
    setOpen(!pinned);
  }

  return (
    <span
      ref={ref}
      className="relative shrink-0"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") schedule(true, OPEN_DELAY);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") schedule(false, CLOSE_DELAY);
      }}
    >
      <button
        type="button"
        aria-label="Info"
        aria-expanded={open}
        onClick={toggle}
        className="flex shrink-0 text-text-muted transition-colors hover:text-text"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="16" y2="12" />
          <line x1="12" x2="12.01" y1="8" y2="8" />
        </svg>
      </button>
      <span
        aria-hidden={!open}
        className={`absolute left-0 top-full z-20 mt-1.5 w-60 rounded-md border border-border bg-surface-2 p-2 text-left text-ui leading-snug text-text shadow-lg transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {text}
      </span>
    </span>
  );
}
