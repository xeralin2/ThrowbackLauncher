"use client";

import { Fragment } from "react";
import { setPlatformView, usePlatformView } from "@/lib/platform-view";
import type { ThrowbackOS } from "@/lib/bridge";

const PLATFORMS: { id: ThrowbackOS; label: string }[] = [
  { id: "windows", label: "Windows" },
  { id: "linux", label: "Linux" },
];

export function PlatformSwitch() {
  const platform = usePlatformView();
  if (!platform) return null;
  return (
    <div className="flex items-center gap-1.5 font-mono text-label tracking-[0.04em] text-text-muted">
      {PLATFORMS.map((entry, index) => (
        <Fragment key={entry.id}>
          {index > 0 && <span aria-hidden>/</span>}
          <button
            type="button"
            aria-label={entry.label}
            aria-pressed={platform === entry.id}
            onClick={() => setPlatformView(entry.id)}
            className={`cursor-pointer transition-colors ${
              platform === entry.id
                ? "font-semibold text-text"
                : "hover:text-text"
            }`}
          >
            {entry.label}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
