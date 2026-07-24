import type { KeyboardEvent } from "react";

export function openOnKey(open: () => void) {
  return (event: KeyboardEvent) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  };
}
