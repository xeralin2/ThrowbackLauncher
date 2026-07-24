"use client";

import { useState } from "react";
import { iconButton, iconButtonDanger } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { Note } from "@/components/Note";
import { Tag } from "@/components/Tag";
import { TrashIcon } from "@/components/TrashIcon";
import { useCheatEngine, type CheatEngineSeason } from "@/lib/bridge";
import { showToast } from "@/lib/toast";

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CheatEngineInstaller() {
  const [seasons, setSeasons] = useState<CheatEngineSeason[] | null>(null);
  const [busy, setBusy] = useState(false);
  const ce = useCheatEngine({
    onDone: (ok, message) => {
      setBusy(false);
      showToast(ok ? "success" : "error", message);
    },
  });

  function add(season: CheatEngineSeason) {
    if (season.present) {
      ce.register(season.key, (result) => {
        showToast(result.ok ? "success" : "error", result.message);
        ce.seasons(setSeasons);
      });
      return;
    }
    ce.pickInstaller((path) => {
      if (!path) return;
      setSeasons(null);
      setBusy(true);
      ce.install(season.key);
    });
  }

  function remove(key: string) {
    ce.remove(key, (result) => {
      showToast(result.ok ? "success" : "error", result.message);
      ce.seasons(setSeasons);
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={busy || !ce.ready}
        onClick={() => ce.seasons(setSeasons)}
        className={`text-link hover:underline disabled:cursor-not-allowed disabled:no-underline ${busy ? "animate-pulse" : "disabled:opacity-60"}`}
      >
        Set up Cheat Engine
      </button>

      {seasons && (
        <Dialog title="Cheat Engine" onClose={() => setSeasons(null)}>
          {seasons.length === 0 ? (
            <p className="text-body text-text-muted">
              Install a season first, then Cheat Engine can be added to it.
            </p>
          ) : (
            <>
              <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
                {seasons.map((season) => (
                  <div
                    key={season.key}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate-fade font-mono text-label text-text">
                      {season.label}
                    </span>
                    {season.hasCe ? (
                      <span className="flex shrink-0 items-center gap-2">
                        <Tag>Installed</Tag>
                        <button
                          type="button"
                          aria-label={`Remove Cheat Engine from ${season.label}`}
                          onClick={() => remove(season.key)}
                          className={iconButtonDanger}
                        >
                          <TrashIcon />
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Add Cheat Engine to ${season.label}`}
                        onClick={() => add(season)}
                        className={`shrink-0 ${iconButton}`}
                      >
                        <PlusIcon />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <Note className="mt-4">
                Deny any bundled offers to avoid adware.
              </Note>
            </>
          )}
        </Dialog>
      )}
    </>
  );
}
