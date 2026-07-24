"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { BackHeading } from "@/components/BackHeading";
import { Button } from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Dialog } from "@/components/Dialog";
import { ExternalLink } from "@/components/ExternalLink";
import { type LogLine } from "@/components/LogBox";
import { SeasonInfo } from "@/components/SeasonInfo";
import { SeasonCover, coverFade } from "@/components/SeasonCover";
import { ShearsModal } from "@/components/ShearsModal";
import { TabGroup, Tabs, type TabItem } from "@/components/Tabs";
import { codeChip, SplitTag, Tag } from "@/components/Tag";
import { TransferPanel, TransferPercent } from "@/components/TransferPanel";
import { UninstallModal } from "@/components/UninstallModal";
import { showToast } from "@/lib/toast";
import {
  useDownloader,
  useLaunch,
  useLibraries,
  useSettings,
  type LaunchStatus,
  type LibraryEntry,
  type Season,
} from "@/lib/bridge";
import { SEASON_INFO, type SeasonInfoEntry } from "@/config/season-info";
import { operatorsLocked } from "@/lib/seasons";

const LOG_CAP = 1000;

const INDEV_RELEASES_URL =
  "https://discord.com/channels/1321476389815324733/1498791837346037861";

const HM_INFO: Omit<SeasonInfoEntry, "release"> = {
  summary: (
    <>
      Heated Metal is a full SDK (Software Development Kit) for R6S by{" "}
      <ExternalLink href="https://github.com/DataCluster0/HeatedMetal">
        DataCluster0
      </ExternalLink>{" "}
      that adds extended capabilities to specific old game builds.
    </>
  ),
  operators: [],
  maps: [],
  highlights: [
    "Quarrel — a full extended scripting language",
    "Map editor — create and modify maps in-game",
    "Cosmetic and attachment unlocks without restrictions",
    "In-game console, weapon inspection and custom keybinds",
  ],
};

function LibraryPicker({
  libraries,
  selected,
  onSelect,
}: {
  libraries: LibraryEntry[];
  selected: string;
  onSelect: (path: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-body text-text-muted">Choose your library</p>
      <div className="flex flex-col gap-2">
        {libraries.map((library) => (
          <button
            key={library.path}
            type="button"
            disabled={!library.exists}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(library.path)}
            className={`flex items-center justify-between gap-3 rounded-md border bg-surface-2 px-3 py-2 text-left transition ${
              library.path === selected
                ? "border-action-edge shadow-[0_2px_18px_var(--color-action-glow)]"
                : "border-border"
            } ${
              library.exists
                ? "hover:border-action-edge"
                : "cursor-not-allowed opacity-50"
            }`}
          >
            <span
              title={library.path}
              className="min-w-0 grow truncate-fade font-mono text-label text-text"
            >
              {library.display}
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              {library.default && <Tag>Default</Tag>}
              {!library.exists && <Tag variant="amber">Not found</Tag>}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BetaHint() {
  return (
    <p className="text-body text-text-muted">
      This build is only available on the Heated Metal Discord. Download the{" "}
      <code className={codeChip}>.7z</code> archive from{" "}
      <ExternalLink
        href={INDEV_RELEASES_URL}
        className="text-link hover:underline [&>code]:text-inherit"
      >
        <code className={codeChip}>#indev-releases</code>
      </ExternalLink>{" "}
      first, then choose it here.
    </p>
  );
}

const NO_STATUS: LaunchStatus = {
  tb: { installed: false, partial: false },
  hm: { installed: false, partial: false },
};

type TabId = "play" | "manage" | "info";

const VARIANT_TABS: TabItem<"tb" | "hm">[] = [
  { id: "tb", label: "Throwback" },
  { id: "hm", label: "Heated Metal" },
];

export function SeasonDetail({
  season,
  hm,
  onHmChange,
  onBack,
}: {
  season: Season;
  hm: boolean;
  onHmChange: (hm: boolean) => void;
  onBack: () => void;
}) {
  const [log, setLog] = useState<LogLine[]>([]);
  const logId = useRef(0);
  const [shearsOpen, setShearsOpen] = useState(false);
  const [uninstallFor, setUninstallFor] = useState<boolean | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [dlPrompt, setDlPrompt] = useState(false);
  const [dlHm, setDlHm] = useState(false);
  const [deleteFor, setDeleteFor] = useState<boolean | null>(null);
  const [dlLibrary, setDlLibrary] = useState("");
  const [tab, setTab] = useState<TabId | null>(null);
  const [status, setStatus] = useState<LaunchStatus>(NO_STATUS);
  const deferredLog = useDeferredValue(log);
  const seededRef = useRef(false);
  const lc = useLaunch();
  const settings = useSettings();
  const [libraryEntries, refreshLibraries] = useLibraries();
  const libs = useMemo(() => libraryEntries ?? [], [libraryEntries]);
  const multiLib = libs.length > 1;
  const hmActive = hm && season.hmAvailable;

  const syncStatus = useCallback(() => {
    lc.status(season.key, (next) => {
      setStatus(next);
      setTab((prev) => prev ?? "play");
    });
  }, [lc, season.key]);

  const dl = useDownloader({
    onLog: (line) => {
      if (dl.activeKey !== season.key) return;
      setLog((prev) =>
        [
          ...prev,
          ...line.split("\n").map((text) => ({ id: logId.current++, text })),
        ].slice(-LOG_CAP),
      );
    },
    onDone: () => syncStatus(),
    onPartialDeleted: (key) => {
      if (key === season.key) syncStatus();
    },
  });

  const active = dl.activeKey === season.key;
  const state = active ? dl.state : "idle";
  const running = active && dl.running;
  const verifying = active && dl.verifying;
  const busy = dl.running;
  const variantRunning = (hm: boolean) =>
    lc.running.some((ref) => ref.key === season.key && ref.hm === hm);
  const variantLaunching = (hm: boolean) =>
    lc.launching?.key === season.key && lc.launching.hm === hm;
  const queuedFor = (hm: boolean) =>
    dl.queue.some(
      (entry) => entry.key === season.key && entry.hm === hm && !entry.verify,
    );
  const verifyQueuedFor = (hm: boolean) =>
    dl.queue.some(
      (entry) => entry.key === season.key && entry.hm === hm && entry.verify,
    );
  const vs = hmActive ? status.hm : status.tb;
  const activeVariant = active && dl.activeHm === hmActive;
  const runningVariant = activeVariant && dl.running;
  const verifyingVariant = activeVariant && dl.verifying;
  const stateVariant = activeVariant ? dl.state : "idle";
  if (running && shearsOpen) setShearsOpen(false);
  if (running && uninstallFor !== null) setUninstallFor(null);
  if (running && removeOpen) setRemoveOpen(false);
  if (running && switchOpen) setSwitchOpen(false);
  if (tab === "manage" && !vs.installed) setTab("play");

  useEffect(() => {
    if (seededRef.current || !dl.ready) return;
    if (dl.activeKey === season.key) {
      seededRef.current = true;
      dl.loadHistory((history) => {
        setLog(
          history
            ? history
                .split("\n")
                .slice(-LOG_CAP)
                .map((text) => ({ id: logId.current++, text }))
            : [],
        );
      });
    }
  }, [dl, season.key]);

  useEffect(() => {
    if (lc.ready) syncStatus();
  }, [lc.ready, syncStatus]);

  useEffect(() => {
    if (!settings) return;
    const onLibraries = () => syncStatus();
    settings.libraries_changed.connect(onLibraries);
    return () => settings.libraries_changed.disconnect(onLibraries);
  }, [settings, syncStatus]);

  const prevLibPaths = useRef<string[] | null>(null);
  useEffect(() => {
    const paths = libs.map((library) => library.path);
    const prev = prevLibPaths.current;
    prevLibPaths.current = paths;
    if (!dlPrompt || !prev) return;
    const added = paths.find((path) => !prev.includes(path));
    if (added) setDlLibrary(added);
  }, [libs, dlPrompt]);

  function startDownload(hm: boolean, library = "") {
    setDlPrompt(false);
    const lib = (hm ? status.hm : status.tb).partial ? "" : library;
    if (busy) {
      dl.enqueue(season.key, hm, lib);
      return;
    }
    setLog([]);
    dl.start(season.key, hm, lib);
  }

  function preferredLibrary(): string {
    const preferred =
      libs.find((library) => library.default && library.exists) ??
      libs.find((library) => library.exists);
    return preferred?.path ?? "";
  }

  function openDownloadPrompt() {
    refreshLibraries();
    setDlLibrary(preferredLibrary());
    setDlHm(hmActive);
    if (multiLib) setDlPrompt(true);
    else startDownload(hmActive, preferredLibrary());
  }

  function guardBusy(open: () => void) {
    if (busy) {
      showToast("warning", "Wait for the active download to finish");
    } else {
      open();
    }
  }

  function playButtons(hm: boolean) {
    return variantRunning(hm) ? (
      <Button variant="primary" onClick={() => lc.stop(season.key)}>
        Stop
      </Button>
    ) : variantLaunching(hm) ? (
      <Button
        variant="primary"
        disabled
        className="animate-pulse disabled:opacity-100"
      >
        Launching
      </Button>
    ) : (
      <Button variant="primary" onClick={() => lc.launch(season.key, hm)}>
        Play
      </Button>
    );
  }

  function verifyButton(hm: boolean) {
    return verifyQueuedFor(hm) ? (
      <Button variant="secondary" onClick={() => dl.dequeue(season.key, hm)}>
        Remove from queue
      </Button>
    ) : (
      <Button
        variant="secondary"
        onClick={() => {
          if (!busy) setLog([]);
          dl.verify(season.key, hm);
        }}
      >
        {busy ? "Queue verify" : "Verify"}
      </Button>
    );
  }

  const runInstalled = dl.activeHm ? status.hm.installed : status.tb.installed;
  const cancelRun = verifying || runInstalled;
  const statusAction =
    state === "downloading" ? (
      <Button
        variant="secondary"
        onClick={() => (cancelRun ? dl.cancel() : dl.setPaused(true))}
      >
        {cancelRun ? "Cancel" : "Pause"}
      </Button>
    ) : (
      <Button
        variant="secondary"
        disabled
        className="animate-pulse disabled:opacity-100"
      >
        {cancelRun ? "Cancel" : "Pause"}
      </Button>
    );

  const statusTags = (
    <>
      {vs.installed ||
      vs.partial ||
      runningVariant ||
      queuedFor(hmActive) ||
      (activeVariant && stateVariant === "paused") ? (
        <SplitTag
          size="md"
          variant={
            verifyingVariant
              ? "purple"
              : runningVariant
                ? "purple"
                : vs.installed
                  ? "brand"
                  : stateVariant === "failed"
                    ? "amber"
                    : "steel"
          }
          left={`${season.sizeGb} GB`}
          right={
            verifyingVariant
              ? "Verifying"
              : runningVariant
                ? stateVariant === "preparing"
                  ? "Preparing"
                  : stateVariant === "applying"
                    ? "Applying"
                    : "Downloading"
                : vs.installed
                  ? variantRunning(hmActive)
                    ? "Running"
                    : variantLaunching(hmActive)
                      ? "Launching"
                      : "Installed"
                  : queuedFor(hmActive)
                    ? "Queued"
                    : stateVariant === "failed"
                      ? "Failed"
                      : "Paused"
          }
        />
      ) : (
        <Tag size="md">{season.sizeGb} GB</Tag>
      )}
      {!hmActive && operatorsLocked(season.key) && (
        <Tag size="md" variant="amber">
          Locked Operators
        </Tag>
      )}
    </>
  );

  const info = SEASON_INFO[season.key];
  const tabs: TabItem<TabId>[] = [
    { id: "play", label: "Play" },
    { id: "manage", label: "Manage", disabled: !vs.installed },
    ...(hmActive || info ? [{ id: "info" as const, label: "Info" }] : []),
  ];

  return (
    <>
      <div
        className={
          tab === "info"
            ? "flex flex-col"
            : "flex h-[calc(100dvh_-_var(--topbar-h)_-_3rem)] flex-col max-[48em]:h-[calc(100dvh_-_var(--topbar-h)_-_2.5rem)] min-[100em]:h-[calc(100dvh_-_var(--topbar-h)_-_5rem)]"
        }
      >
        <BackHeading
          title={`${season.code} ${hmActive ? "Heated Metal" : season.name}`}
          onBack={onBack}
        />

        <div className="relative mb-3 h-[214px] min-h-[160px] overflow-hidden rounded-lg border border-border">
          {hmActive ? (
            <Image
              src="/media/others/hm.webp"
              alt=""
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
          ) : (
            <>
              <SeasonCover cover={season.cover} sizes="100vw" priority />
              <div className={coverFade} />
            </>
          )}

          <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2">
            {statusTags}
          </div>
        </div>

        <Tabs
          tabs={tabs}
          active={tab}
          onSelect={setTab}
          trailing={
            season.hmAvailable ? (
              <TabGroup
                tabs={VARIANT_TABS}
                active={hmActive ? "hm" : "tb"}
                onSelect={(id) => onHmChange(id === "hm")}
              />
            ) : undefined
          }
        />

        {tab !== "info" && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {running && statusAction}
            {!running &&
              tab === "play" &&
              (vs.installed ? (
                playButtons(hmActive)
              ) : queuedFor(hmActive) ? (
                <Button
                  variant="secondary"
                  onClick={() => dl.dequeue(season.key, hmActive)}
                >
                  Remove from queue
                </Button>
              ) : (
                <>
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (vs.partial) startDownload(hmActive);
                      else openDownloadPrompt();
                    }}
                  >
                    {busy
                      ? "Queue download"
                      : vs.partial
                        ? "Continue download"
                        : "Download"}
                  </Button>
                  {vs.partial && (
                    <Button
                      variant="secondary"
                      onClick={() => setDeleteFor(hmActive)}
                    >
                      Remove
                    </Button>
                  )}
                  {!vs.partial &&
                    (hmActive ? status.tb.installed : status.hm.installed) && (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          guardBusy(() =>
                            hmActive
                              ? setSwitchOpen(true)
                              : setRemoveOpen(true),
                          )
                        }
                      >
                        {hmActive ? "Switch to HM" : "Switch to TB"}
                      </Button>
                    )}
                </>
              ))}
            {!running && tab === "manage" && (
              <>
                {verifyButton(hmActive)}
                {hmActive && season.hmBeta && (
                  <Button
                    variant="secondary"
                    onClick={() => guardBusy(() => dl.importHm(season.key))}
                  >
                    Replace HM files
                  </Button>
                )}
                {!hmActive && (
                  <Button
                    variant="secondary"
                    onClick={() => setShearsOpen(true)}
                  >
                    Shears
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => setUninstallFor(hmActive)}
                >
                  Uninstall
                </Button>
              </>
            )}
            <TransferPercent state={state} />
          </div>
        )}

        {tab === "info" ? (
          <div className="mt-2">
            {hmActive ? (
              <SeasonInfo
                entry={{
                  ...HM_INFO,
                  release: info?.release ?? "",
                  note: season.hmBeta ? (
                    <>
                      The Heated Metal beta build comes from the{" "}
                      <ExternalLink href={INDEV_RELEASES_URL}>
                        <code>#indev-releases</code>
                      </ExternalLink>{" "}
                      channel on the Heated Metal Discord.
                    </>
                  ) : undefined,
                }}
                build={season.build}
              />
            ) : (
              info && <SeasonInfo entry={info} build={season.build} />
            )}
          </div>
        ) : (
          <TransferPanel
            lines={deferredLog}
            active={running || state === "paused"}
            state={state}
          />
        )}
      </div>

      {dlPrompt && (
        <Dialog
          title="Download"
          onClose={() => setDlPrompt(false)}
          onConfirm={() => startDownload(dlHm, dlLibrary)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDlPrompt(false)}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => settings?.add_library()}
              >
                Add library
              </Button>
              <Button
                variant="primary"
                onClick={() => startDownload(dlHm, dlLibrary)}
              >
                {busy ? "Queue download" : "Download"}
              </Button>
            </>
          }
        >
          <LibraryPicker
            libraries={libs}
            selected={dlLibrary}
            onSelect={setDlLibrary}
          />
        </Dialog>
      )}

      {deleteFor !== null && (
        <ConfirmModal
          title="Remove download"
          confirmLabel="Remove"
          onConfirm={() => {
            const hm = deleteFor;
            setDeleteFor(null);
            dl.deletePartial(season.key, hm);
          }}
          onCancel={() => setDeleteFor(null)}
        >
          <p className="text-body text-text-muted">
            This removes the partially downloaded files for{" "}
            {deleteFor ? "Heated Metal" : season.name}.
          </p>
        </ConfirmModal>
      )}

      {switchOpen && (
        <ConfirmModal
          title="Switch to Heated Metal"
          confirmLabel={season.hmBeta ? "Choose archive" : "Switch"}
          onConfirm={() => {
            setSwitchOpen(false);
            dl.switchToHm(season.key);
          }}
          onCancel={() => setSwitchOpen(false)}
        >
          {season.hmBeta ? (
            <BetaHint />
          ) : (
            <p className="text-body text-text-muted">
              This switches your Throwback install to Heated Metal.
            </p>
          )}
        </ConfirmModal>
      )}

      {removeOpen && (
        <ConfirmModal
          title="Switch to Throwback"
          confirmLabel="Switch"
          onConfirm={() => {
            setRemoveOpen(false);
            dl.removeHm(season.key);
          }}
          onCancel={() => setRemoveOpen(false)}
        >
          <p className="text-body text-text-muted">
            This switches your Heated Metal install to Throwback.
          </p>
        </ConfirmModal>
      )}

      {shearsOpen && (
        <ShearsModal season={season} onClose={() => setShearsOpen(false)} />
      )}

      {uninstallFor !== null && (
        <UninstallModal
          season={season}
          hm={uninstallFor}
          onClose={() => setUninstallFor(null)}
          onDone={syncStatus}
        />
      )}
    </>
  );
}
