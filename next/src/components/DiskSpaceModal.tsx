"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { ShearsModal } from "@/components/ShearsModal";
import { useDownloader, useHomeSeasons, type Season } from "@/lib/bridge";

export function DiskSpaceModal() {
  const [space, setSpace] = useState<{ required: number; free: number } | null>(
    null,
  );
  const [shears, setShears] = useState<"pick" | Season | null>(null);
  const [seasons, refreshSeasons] = useHomeSeasons();

  const dl = useDownloader({
    onDiskSpace: (required, free) => {
      refreshSeasons();
      setSpace({ required, free });
    },
  });

  const installed = (seasons ?? []).filter(
    (season) => !season.partial && !season.hm,
  );

  function cancel() {
    dl.cancel();
    setSpace(null);
  }

  function proceed() {
    setSpace(null);
    dl.confirmDiskSpace();
  }

  function openShears() {
    dl.cancel();
    setSpace(null);
    setShears("pick");
  }

  return (
    <>
      {space && (
        <Dialog
          title="Not enough disk space"
          onClose={cancel}
          footer={
            <>
              <Button variant="secondary" onClick={cancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={proceed}>
                Download anyway
              </Button>
            </>
          }
        >
          <p className="text-body text-text-muted">
            This download needs {space.required} GB plus staging headroom but
            the library only has {space.free} GB free. Free up space with{" "}
            {installed.length > 0 ? (
              <button
                type="button"
                onClick={openShears}
                className="text-link hover:underline"
              >
                Shears
              </button>
            ) : (
              "Shears"
            )}{" "}
            or pick a different library.
          </p>
        </Dialog>
      )}

      {shears === "pick" && (
        <Dialog
          title="Shears"
          onClose={() => setShears(null)}
          footer={
            <Button variant="secondary" onClick={() => setShears(null)}>
              Cancel
            </Button>
          }
        >
          <p className="mb-2 text-body text-text-muted">Choose a season</p>
          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {installed.map((season) => (
              <button
                key={season.id}
                type="button"
                onClick={() => setShears(season)}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-left transition hover:border-action-edge"
              >
                <span className="min-w-0 grow truncate-fade font-mono text-label text-text">
                  {season.code} {season.name}
                </span>
                <span className="shrink-0 font-mono text-[0.6rem] text-text-muted">
                  {season.sizeGb} GB
                </span>
              </button>
            ))}
          </div>
        </Dialog>
      )}

      {shears && shears !== "pick" && (
        <ShearsModal season={shears} onClose={() => setShears(null)} />
      )}
    </>
  );
}
