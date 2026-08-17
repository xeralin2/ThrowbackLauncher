"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useDownloader } from "@/lib/bridge";

export function DiskSpaceModal() {
  const [shortfall, setShortfall] = useState<number | null>(null);

  const dl = useDownloader({
    onDiskSpace: setShortfall,
  });

  function cancel() {
    dl.cancel();
    setShortfall(null);
  }

  function proceed() {
    setShortfall(null);
    dl.confirmDiskSpace();
  }

  if (shortfall === null) return null;

  return (
    <ConfirmModal
      title="Not enough disk space"
      confirmLabel="Download anyway"
      confirmOnEnter={false}
      onConfirm={proceed}
      onCancel={cancel}
    >
      <p className="text-body text-text-muted">
        Free up <code>{shortfall} GB</code> with Shears or pick a different
        library.
      </p>
    </ConfirmModal>
  );
}
