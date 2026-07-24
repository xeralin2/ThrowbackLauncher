export type ToastKind = "success" | "warning" | "error";

type ToastOptions = { key?: string };

export function showToast(
  kind: ToastKind,
  text: string,
  options: ToastOptions = {},
): void {
  window.dispatchEvent(
    new CustomEvent("throwback:toast", { detail: { kind, text, ...options } }),
  );
}

export function dismissToast(key: string): void {
  window.dispatchEvent(
    new CustomEvent("throwback:toast-dismiss", { detail: { key } }),
  );
}
