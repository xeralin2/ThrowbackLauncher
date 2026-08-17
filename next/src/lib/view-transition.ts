"use client";

import { flushSync } from "react-dom";

let switching = false;

export function isSwitching(): boolean {
  return switching;
}

export function withViewTransition(apply: () => void, type?: string): void {
  const update = () => {
    switching = true;
    flushSync(apply);
    queueMicrotask(() => {
      switching = false;
    });
  };
  if (typeof document.startViewTransition !== "function") {
    update();
    return;
  }
  document.startViewTransition(type ? { update, types: [type] } : update);
}
