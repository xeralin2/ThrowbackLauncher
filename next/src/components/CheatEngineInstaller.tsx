"use client";

import { useState } from "react";
import { Button, iconButton } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { Note } from "@/components/Note";
import { ListRow } from "@/components/ui";
import { Tag } from "@/components/Tag";
import { RemoveIcon } from "@/components/RemoveIcon";
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
      className="size-4"
      aria-hidden="true"
      focusable="false"
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
      ce.add(season.key, (result) => {
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
        className={`text-link hover:underline disabled:cursor-not-allowed disabled:no-underline ${busy ? "animate-pulse" : "disabled:opacity-40"}`}
      >
        Set up Cheat Engine
      </button>

      {seasons && (
        <Dialog
          title="Cheat Engine"
          onClose={() => setSeasons(null)}
          footer={
            <>
              {seasons.length > 0 && (
                <Note className="mr-auto">
                  Deny any bundled offers to avoid adware.
                </Note>
              )}
              <Button variant="secondary" onClick={() => setSeasons(null)}>
                Close
              </Button>
            </>
          }
        >
          {seasons.length === 0 ? (
            <p className="text-body text-text-muted">
              Install a season first, then Cheat Engine can be added to it.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {seasons.map((season) => (
                <ListRow key={season.key} label={season.label}>
                  {season.hasCe ? (
                    <span className="flex shrink-0 items-center gap-2">
                      <Tag>Installed</Tag>
                      <button
                        type="button"
                        aria-label={`Remove Cheat Engine from ${season.label}`}
                        onClick={() => remove(season.key)}
                        className={iconButton}
                      >
                        <RemoveIcon />
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
                </ListRow>
              ))}
            </div>
          )}
        </Dialog>
      )}
    </>
  );
}
