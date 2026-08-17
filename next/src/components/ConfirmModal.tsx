"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";

export function ConfirmModal({
  title,
  confirmLabel,
  busyLabel,
  busy = false,
  confirmOnEnter = true,
  onConfirm,
  onCancel,
  children,
}: {
  title: string;
  confirmLabel: string;
  busyLabel?: string;
  busy?: boolean;
  confirmOnEnter?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  return (
    <Dialog
      title={title}
      onClose={busy ? undefined : onCancel}
      onConfirm={busy || !confirmOnEnter ? undefined : onConfirm}
      footer={
        <>
          <Button variant="secondary" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" disabled={busy} onClick={onConfirm}>
            {busy && busyLabel ? busyLabel : confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
