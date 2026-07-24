"use client";

import { useEffect, useState } from "react";
import { iconButtonDanger } from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { TrashIcon } from "@/components/TrashIcon";
import { useUninstall, type Season, type UninstallTargets } from "@/lib/bridge";
import { showToast } from "@/lib/toast";

type ItemId = "files" | "prefix";

export function UninstallModal({
  season,
  hm,
  onClose,
  onDone,
}: {
  season: Season;
  hm: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [targets, setTargets] = useState<UninstallTargets | null>(null);
  const [busy, setBusy] = useState(false);
  const [itemBusy, setItemBusy] = useState<ItemId | null>(null);

  const un = useUninstall({
    onDone: (ok, message) => {
      setBusy(false);
      if (ok) {
        onDone();
        onClose();
      } else {
        showToast("error", message);
      }
    },
    onItemDone: (item, ok, message) => {
      setItemBusy(null);
      if (!ok) {
        showToast("error", message);
        return;
      }
      showToast("success", message);
      const next = targets
        ? item === "files"
          ? { ...targets, folder: "" }
          : { ...targets, prefix: "" }
        : targets;
      setTargets(next);
      if (item === "files") onDone();
      if (next && !next.folder && !next.prefix) onClose();
    },
  });

  useEffect(() => {
    if (un.ready) un.preview(season.key, hm, setTargets);
  }, [un, season.key, hm]);

  function confirm() {
    if (targets && !targets.folder && targets.prefix) {
      deleteItem("prefix");
      return;
    }
    setBusy(true);
    un.run(season.key, hm);
  }

  function deleteItem(item: ItemId) {
    setItemBusy(item);
    un.runItem(season.key, hm, item);
  }

  const blocked = busy || itemBusy !== null;

  const items: { id: ItemId; label: string; sub?: string }[] = [
    ...(targets?.folder
      ? [{ id: "files" as ItemId, label: "Game files", sub: targets.folder }]
      : []),
    ...(targets?.prefix
      ? [{ id: "prefix" as ItemId, label: "Proton prefix" }]
      : []),
  ];

  return (
    <ConfirmModal
      title={`Uninstall ${hm ? "Heated Metal" : season.name}`}
      confirmLabel="Uninstall"
      busyLabel={busy ? "Removing…" : undefined}
      busy={blocked}
      onConfirm={confirm}
      onCancel={onClose}
    >
      <p className="mb-4 text-body text-text-muted">
        This permanently deletes the items below.
      </p>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-2.5 text-body text-text"
          >
            <button
              type="button"
              aria-label={`Remove ${item.label}`}
              disabled={blocked}
              onClick={() => deleteItem(item.id)}
              className={`-m-1 -mt-[3px] ${iconButtonDanger}`}
            >
              <TrashIcon />
            </button>
            <span className="min-w-0">
              {item.label}
              {item.sub && (
                <span className="mt-0.5 block break-all font-mono text-label text-text-muted">
                  {item.sub}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </ConfirmModal>
  );
}
