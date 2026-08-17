"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePlatformView } from "@/lib/platform-view";

export type FaqItem = {
  id: number;
  q: string;
  display?: ReactNode;
  a: ReactNode;
  platform?: "windows" | "linux";
};

function Chevron() {
  return (
    <svg
      className="question-chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function Item({ item, index }: { item: FaqItem; index: number }) {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const answerId = `faq-${index}-answer`;
  const anchor = `q${item.id}`;

  useEffect(() => {
    function openFromHash() {
      if (window.location.hash.slice(1) !== anchor) return;
      setOpen(true);
      setPulse(true);
      requestAnimationFrame(() =>
        document.getElementById(anchor)?.scrollIntoView({ block: "start" }),
      );
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [anchor]);

  return (
    <div
      id={anchor}
      data-reveal
      onAnimationEnd={(event) => {
        if (event.animationName === "hashPulse") setPulse(false);
      }}
      className={`question${open ? " open row-selected" : ""}${pulse ? " hash-pulse" : ""}`}
    >
      <button
        type="button"
        className="question-header"
        aria-expanded={open}
        aria-controls={answerId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="question-title">{item.display ?? item.q}</span>
        <Chevron />
      </button>
      <div id={answerId} className="answer" inert={!open}>
        <div className="answer-clip">
          <div className="answer-inner">{item.a}</div>
        </div>
      </div>
    </div>
  );
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const os = usePlatformView();
  const visible = items.filter(
    (item) => !item.platform || item.platform === os,
  );
  return (
    <div className="faq-list">
      {visible.map((item, index) => (
        <Item key={item.q} item={item} index={index} />
      ))}
    </div>
  );
}
