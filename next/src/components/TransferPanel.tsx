"use client";

import { LogBox, type LogLine } from "@/components/LogBox";
import { determinatePercent, useDownloadProgress } from "@/lib/bridge";

function percentValue(
  progress: number,
  step: number,
  steps: number,
  state: string,
): number | null {
  if (state !== "downloading" && state !== "paused") return null;
  return determinatePercent(progress, step, steps);
}

export function TransferPercent({ state }: { state: string }) {
  const { progress, step, steps } = useDownloadProgress();
  const percent = percentValue(progress, step, steps, state);
  if (percent === null) return null;
  return (
    <span className="block translate-y-[1.5px] font-display text-[1.15rem] font-bold leading-none tabular-nums text-text">
      {percent}%
    </span>
  );
}

export function TransferPanel({
  lines,
  active,
  state,
}: {
  lines: LogLine[];
  active: boolean;
  state: string;
}) {
  const { progress, step, steps } = useDownloadProgress();
  if (!lines.length || (!active && state !== "failed")) return null;

  const paused = state === "paused";
  const percent = percentValue(progress, step, steps, state);

  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex h-5 shrink-0 items-center">
        {active && (
          <div className="h-3 flex-1 rounded-full border border-border bg-well">
            <div
              key={percent === null ? "indeterminate" : "determinate"}
              data-paused={paused || undefined}
              className={`transfer-fill h-full min-w-3 rounded-full ${
                percent === null
                  ? "w-full"
                  : "transition-[width] duration-200 ease-out"
              }`}
              style={percent === null ? undefined : { width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <LogBox lines={lines} className="min-h-24 flex-1" />
    </div>
  );
}
