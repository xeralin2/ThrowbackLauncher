"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

const stack: symbol[] = [];
let scrollLocks = 0;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({
  title,
  children,
  footer,
  onClose,
  onConfirm,
}: {
  title: string;
  children?: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  onConfirm?: () => void;
}) {
  const id = useRef(Symbol("dialog"));
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = id.current;
    const panel = panelRef.current;
    const previous = document.activeElement;
    stack.push(dialog);
    if (++scrollLocks === 1) document.body.style.overflow = "hidden";
    if (panel && !panel.contains(document.activeElement)) panel.focus();

    function onTab(event: KeyboardEvent) {
      if (event.key !== "Tab" || stack.at(-1) !== dialog || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const active = document.activeElement;
      const inside = active instanceof HTMLElement && panel.contains(active);
      const edge = event.shiftKey ? items[0] : items[items.length - 1];
      if (!inside || active === edge || active === panel) {
        event.preventDefault();
        (event.shiftKey ? items[items.length - 1] : items[0]).focus();
      }
    }
    window.addEventListener("keydown", onTab);
    return () => {
      window.removeEventListener("keydown", onTab);
      stack.splice(stack.indexOf(dialog), 1);
      if (--scrollLocks === 0) document.body.style.overflow = "";
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  useEffect(() => {
    if (!onClose && !onConfirm) return;
    function onKey(event: KeyboardEvent) {
      if (stack.at(-1) !== id.current) return;
      if (event.key === "Escape") {
        onClose?.();
        return;
      }
      if (event.key !== "Enter" || event.isComposing) return;
      const active = document.activeElement;
      if (
        active instanceof HTMLButtonElement ||
        active instanceof HTMLAnchorElement
      )
        return;
      onConfirm?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onConfirm]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget) onClose?.();
      }}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 animate-fade-in"
    >
      <div className="animate-fade-up">
        <div
          ref={panelRef}
          tabIndex={-1}
          className="max-h-[calc(100dvh-3rem)] w-[min(440px,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-border bg-surface p-6 outline-none"
        >
          <h2
            id={titleId}
            className="mb-2 font-display text-[1.2rem] font-semibold text-text"
          >
            {title}
          </h2>
          {children}
          {footer && (
            <div className="mt-5 flex justify-end gap-2">{footer}</div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
