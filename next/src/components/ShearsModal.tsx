"use client";

import { useEffect, useState } from "react";
import { Button, iconButton } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { Note } from "@/components/Note";
import { ListRow } from "@/components/ui";
import { valueChip } from "@/components/VersionChip";
import { RemoveIcon } from "@/components/RemoveIcon";
import {
  useShears,
  type Season,
  type ShearsKind,
  type ShearsScan,
} from "@/lib/bridge";
import { showToast } from "@/lib/toast";

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exp = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exp;
  const text = exp === 0 || value >= 100 ? Math.round(value) : value.toFixed(1);
  return `${text} ${units[exp]}`;
}

export function ShearsModal({
  season,
  onClose,
}: {
  season: Season;
  onClose: () => void;
}) {
  const shears = useShears();
  const [scan, setScan] = useState<ShearsScan | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (shears.ready)
      shears.scan(season.key, (result) => {
        setScan(result.scan);
        if (!result.ok) showToast("error", result.message);
      });
  }, [shears, season.key]);

  function cut(kind: ShearsKind, level: number) {
    setBusy(true);
    shears.cut(season.key, kind, level, (result) => {
      setBusy(false);
      if (result.ok) {
        setScan(result.scan);
        if (result.freed > 0)
          showToast("success", `Freed ${formatBytes(result.freed)}`);
      } else {
        showToast("error", result.message);
      }
    });
  }

  const tiers = scan?.tiers ?? [];
  const videos = scan?.videos ?? 0;
  const events = scan?.events ?? 0;
  const actions: {
    key: string;
    label: string;
    size: number;
    run: () => void;
  }[] = [];
  if (videos > 0) {
    actions.push({
      key: "videos",
      label: "Videos",
      size: videos,
      run: () => cut("videos", 0),
    });
  }
  if (events > 0) {
    actions.push({
      key: "events",
      label: "Events",
      size: events,
      run: () => cut("events", 0),
    });
  }
  for (let k = 0; k < tiers.length - 1; k++) {
    actions.push({
      key: `tex-${tiers[k].level}`,
      label: `Textures above ${tiers[k].quality}`,
      size: tiers.slice(k + 1).reduce((sum, t) => sum + t.size, 0),
      run: () => cut("textures", tiers[k].level),
    });
  }

  return (
    <Dialog
      title="Shears"
      onClose={busy ? undefined : onClose}
      footer={
        <>
          {actions.length > 0 && (
            <Note className="mr-auto">
              Cut optional content you do not need.
            </Note>
          )}
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      {!scan ? (
        <p className="animate-pulse font-mono text-ui text-text-muted">
          Scanning
        </p>
      ) : actions.length === 0 ? (
        <p className="text-body text-text-muted">Nothing to cut.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {actions.map((action) => (
            <ListRow key={action.key} label={action.label}>
              <span className="flex shrink-0 items-center gap-2">
                <code className={valueChip}>{formatBytes(action.size)}</code>
                <button
                  type="button"
                  aria-label={`Remove ${action.label}`}
                  disabled={busy}
                  onClick={action.run}
                  className={iconButton}
                >
                  <RemoveIcon />
                </button>
              </span>
            </ListRow>
          ))}
        </div>
      )}
    </Dialog>
  );
}
