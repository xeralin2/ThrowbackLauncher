"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export type TabItem<T extends string> = {
  id: T;
  label: string;
  disabled?: boolean;
};

export function TabGroup<T extends string>({
  tabs,
  active,
  onSelect,
}: {
  tabs: TabItem<T>[];
  active: T | null;
  onSelect: (id: T) => void;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    function remeasure() {
      const el = active ? refs.current[active] : null;
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
    remeasure();
    window.addEventListener("resize", remeasure);
    document.fonts?.ready.then(remeasure);
    return () => window.removeEventListener("resize", remeasure);
  }, [active]);

  return (
    <div className="relative flex gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={(el) => {
            refs.current[tab.id] = el;
          }}
          type="button"
          disabled={tab.disabled}
          onClick={() => onSelect(tab.id)}
          className={`px-4 py-2 font-mono text-label uppercase tracking-[0.12em] transition-colors ${
            active === tab.id
              ? "text-text"
              : tab.disabled
                ? "cursor-not-allowed text-text-muted/40"
                : "text-text-muted hover:text-text"
          }`}
        >
          {tab.label}
        </button>
      ))}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-[-1px] h-[2px] bg-action transition-[left,width] duration-300 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  active,
  onSelect,
  trailing,
}: {
  tabs: TabItem<T>[];
  active: T | null;
  onSelect: (id: T) => void;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 border-b border-border">
      <TabGroup tabs={tabs} active={active} onSelect={onSelect} />
      {trailing}
    </div>
  );
}
