"use client";

import { useEffect, useState } from "react";
import type { ToastKind } from "@/lib/toast";

type Entry = {
  id: number;
  kind: ToastKind;
  text: string;
  leaving: boolean;
  key?: string;
};

let nextId = 1;

const MAX_VISIBLE = 3;
const VISIBLE_MS = 4000;
const LEAVE_MS = 350;

const kindClasses: Record<ToastKind, string> = {
  success: "border-border bg-surface-2 text-text",
  warning: "border-notice-border bg-notice-bg-strong text-amber",
  error: "border-notice-border bg-notice-bg-strong text-amber",
};

export function Toasts() {
  const [toasts, setToasts] = useState<Entry[]>([]);

  useEffect(() => {
    let list: Entry[] = [];

    function apply(update: (prev: Entry[]) => Entry[]) {
      list = update(list);
      setToasts(list);
    }

    function dismiss(id: number) {
      if (!list.some((toast) => toast.id === id && !toast.leaving)) return;
      apply((prev) =>
        prev.map((toast) =>
          toast.id === id ? { ...toast, leaving: true } : toast,
        ),
      );
      window.setTimeout(() => {
        apply((prev) => prev.filter((toast) => toast.id !== id));
      }, LEAVE_MS);
    }

    function onToast(raw: Event) {
      const detail = (raw as CustomEvent).detail as {
        kind: ToastKind;
        text: string;
        key?: string;
      };
      const id = nextId++;
      if (detail.key) {
        apply((prev) => prev.filter((toast) => toast.key !== detail.key));
      }
      const active = list.filter((toast) => !toast.leaving);
      if (active.length >= MAX_VISIBLE) dismiss(active[0].id);
      apply((prev) => [
        ...prev,
        {
          id,
          kind: detail.kind,
          text: detail.text,
          key: detail.key,
          leaving: false,
        },
      ]);
      window.setTimeout(() => dismiss(id), VISIBLE_MS);
    }

    function onDismiss(raw: Event) {
      const detail = (raw as CustomEvent).detail as {
        key?: string;
        id?: number;
      };
      const match = list.find(
        (toast) =>
          !toast.leaving &&
          (detail.id !== undefined
            ? toast.id === detail.id
            : toast.key === detail.key),
      );
      if (match) dismiss(match.id);
    }

    window.addEventListener("throwback:toast", onToast);
    window.addEventListener("throwback:toast-dismiss", onDismiss);
    return () => {
      window.removeEventListener("throwback:toast", onToast);
      window.removeEventListener("throwback:toast-dismiss", onDismiss);
    };
  }, []);

  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-5 right-5 z-[200] flex max-w-[360px] flex-col items-end"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`grid transition-[grid-template-rows] duration-[350ms] ${
            toast.leaving
              ? "[grid-template-rows:0fr]"
              : "animate-toast-in [grid-template-rows:1fr]"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(toast.text).catch(() => {});
                window.dispatchEvent(
                  new CustomEvent("throwback:toast-dismiss", {
                    detail: { id: toast.id },
                  }),
                );
              }}
              className={`pointer-events-auto mt-2 cursor-pointer rounded-md border px-4 py-2.5 text-left font-mono text-ui shadow-lg ${
                toast.leaving ? "animate-fade-down" : "animate-fade-up"
              } ${kindClasses[toast.kind]}`}
            >
              {toast.text}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
