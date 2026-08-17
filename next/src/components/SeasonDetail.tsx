"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BackHeading } from "@/components/BackHeading";
import { Button, iconButton } from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Dialog } from "@/components/Dialog";
import { FolderIcon } from "@/components/FolderIcon";
import { ExternalLink } from "@/components/ExternalLink";
import { type LogLine } from "@/components/LogBox";
import { SeasonInfo } from "@/components/SeasonInfo";
import { fieldRow, panel } from "@/components/ui";
import { CardCover } from "@/components/SeasonCover";
import { RemoveIcon } from "@/components/RemoveIcon";
import { ShearsModal } from "@/components/ShearsModal";
import { TabGroup, Tabs, type TabItem } from "@/components/Tabs";
import { SplitTag, Tag } from "@/components/Tag";
import {
  TransferBar,
  TransferPanel,
  TransferPercent,
} from "@/components/TransferPanel";
import { UninstallModal } from "@/components/UninstallModal";
import { showToast } from "@/lib/toast";
import {
  onBridgeReady,
  seasonTitle,
  useDownloader,
  useLaunch,
  useLibraries,
  useSettings,
  type SeasonInstalls,
  type LibraryEntry,
  type Season,
} from "@/lib/bridge";
import { SEASON_INFO, type SeasonInfoEntry } from "@/config/season-info";
import { site } from "@/config/site";
import { operatorsLocked } from "@/lib/seasons";

const LOG_CAP = 1000;

const HM_INFO: Omit<SeasonInfoEntry, "release"> = {
  operators: [],
  maps: [],
  highlights: [
    "Full R6S **SDK** by [DataCluster0](https://github.com/DataCluster0/HeatedMetal) for specific old builds",
    "**Quarrel** scripting language and in-game map editor",
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
    <div className="flex flex-col gap-2">
      {libraries.map((library) => (
        <button
          key={library.path}
          type="button"
          disabled={!library.exists}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(library.path)}
          className={`${fieldRow} text-left transition ${
            library.path === selected
              ? "row-selected"
              : library.exists
                ? "border-border hover:border-action-edge"
                : "border-border cursor-not-allowed opacity-50"
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
  );
}

function BetaHint() {
  return (
    <p className="text-body text-text-muted">
      This build is only available on the Heated Metal Discord. Download the{" "}
      <code>.7z</code> archive from{" "}
      <ExternalLink
        href={site.indevReleasesUrl}
        className="text-link hover:underline [&>code]:text-inherit"
      >
        <code>#indev-releases</code>
      </ExternalLink>{" "}
      first, then choose it here.
    </p>
  );
}

const NO_INSTALLS: SeasonInstalls = {
  tb: { installed: false, partial: false },
  hm: { installed: false, partial: false },
};

type TabId = "manage" | "info";

type Modal =
  | { kind: "shears" }
  | { kind: "uninstall"; hm: boolean }
  | { kind: "switchToThrowback" }
  | { kind: "switchToHeatedMetal" }
  | { kind: "download" }
  | { kind: "removeDownload"; hm: boolean };

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
  const [modal, setModal] = useState<Modal | null>(null);
  const [dlLibrary, setDlLibrary] = useState("");
  const [tab, setTab] = useState<TabId | null>(null);
  const [installs, setInstalls] = useState<SeasonInstalls>(NO_INSTALLS);
  const deferredLog = useDeferredValue(log);
  const seededRef = useRef(false);
  const lc = useLaunch();
  const settings = useSettings();
  const [libraryEntries, refreshLibraries] = useLibraries();
  const libs = useMemo(() => libraryEntries ?? [], [libraryEntries]);
  const multiLib = libs.length > 1;
  const hmActive = hm && season.hmAvailable;

  const refreshInstalls = useCallback(() => {
    lc.installs(season.key, (next) => {
      setInstalls(next);
      setTab((prev) => prev ?? "manage");
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
    onLogHistory: (key, history) => {
      if (key !== season.key) return;
      setLog(
        history
          ? history
              .split("\n")
              .slice(-LOG_CAP)
              .map((text) => ({ id: logId.current++, text }))
          : [],
      );
    },
    onDone: () => refreshInstalls(),
    onPartialDeleted: (key) => {
      if (key === season.key) refreshInstalls();
    },
  });

  const active = dl.activeKey === season.key;
  const running = active && dl.running;
  const busy = dl.running;
  const editionRunning = lc.running.some(
    (ref) => ref.key === season.key && ref.hm === hmActive,
  );
  const editionLaunching =
    lc.launching?.key === season.key && lc.launching.hm === hmActive;
  const queuedFor = dl.queue.some(
    (entry) =>
      entry.key === season.key && entry.hm === hmActive && !entry.verify,
  );
  const verifyQueuedFor = dl.queue.some(
    (entry) =>
      entry.key === season.key && entry.hm === hmActive && entry.verify,
  );
  const vs = hmActive ? installs.hm : installs.tb;
  const activeEdition = active && dl.activeHm === hmActive;
  const runningEdition = activeEdition && dl.running;
  const verifyingEdition = activeEdition && dl.verifying;
  const editionState = activeEdition ? dl.state : "idle";
  const transferring = runningEdition || editionState === "paused";
  if (
    running &&
    modal !== null &&
    modal.kind !== "download" &&
    modal.kind !== "removeDownload"
  )
    setModal(null);

  useEffect(() => {
    if (!dl.ready) return;
    if (dl.activeKey !== season.key) {
      seededRef.current = false;
      return;
    }
    if (!seededRef.current) {
      seededRef.current = true;
      dl.requestLog();
    }
  }, [dl, season.key]);

  useEffect(() => {
    if (lc.ready) refreshInstalls();
  }, [lc.ready, refreshInstalls]);

  useEffect(() => {
    if (!settings) return;
    const onLibraries = () => refreshInstalls();
    settings.libraries_changed.connect(onLibraries);
    return () => settings.libraries_changed.disconnect(onLibraries);
  }, [settings, refreshInstalls]);

  const prevLibPaths = useRef<string[] | null>(null);
  useEffect(() => {
    const paths = libs.map((library) => library.path);
    const prev = prevLibPaths.current;
    prevLibPaths.current = paths;
    if (modal?.kind !== "download" || !prev) return;
    const added = paths.find((path) => !prev.includes(path));
    if (added) setDlLibrary(added);
  }, [libs, modal]);

  function startDownload(library = "") {
    setModal(null);
    const lib = (hmActive ? installs.hm : installs.tb).partial ? "" : library;
    if (busy) {
      dl.enqueue(season.key, hmActive, lib);
      return;
    }
    setLog([]);
    dl.start(season.key, hmActive, lib);
  }

  function preferredLibrary(): string {
    const preferred =
      libs.find((library) => library.default && library.exists) ??
      libs.find((library) => library.exists);
    return preferred?.path ?? "";
  }

  function openDownloadPrompt() {
    refreshLibraries();
    const library = preferredLibrary();
    setDlLibrary(library);
    if (multiLib) setModal({ kind: "download" });
    else startDownload(library);
  }

  function guardBusy(open: () => void) {
    if (busy) {
      showToast("warning", "A download is running");
    } else {
      open();
    }
  }

  function playButtons() {
    return editionRunning ? (
      <Button variant="primary" onClick={() => lc.stop(season.key)}>
        Stop
      </Button>
    ) : editionLaunching ? (
      <Button
        variant="primary"
        disabled
        className="animate-pulse disabled:opacity-100"
      >
        Launching
      </Button>
    ) : (
      <Button variant="primary" onClick={() => lc.launch(season.key, hmActive)}>
        Play
      </Button>
    );
  }

  function verifyButton() {
    return verifyQueuedFor ? (
      <Button
        variant="secondary"
        onClick={() => dl.dequeue(season.key, hmActive)}
      >
        Remove from queue
      </Button>
    ) : (
      <Button
        variant="secondary"
        onClick={() => {
          if (!busy) setLog([]);
          dl.verify(season.key, hmActive);
        }}
      >
        {busy ? "Queue verify" : "Verify"}
      </Button>
    );
  }

  const cancelRun = verifyingEdition || vs.installed;
  const transferActions =
    editionState === "paused" ? (
      <>
        <Button variant="primary" onClick={() => dl.setPaused(false)}>
          Continue
        </Button>
        <Button
          variant="secondary"
          onClick={() => setModal({ kind: "removeDownload", hm: hmActive })}
        >
          Remove
        </Button>
      </>
    ) : editionState === "downloading" ? (
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

  const [tagVariant, tagRight] =
    verifyingEdition || runningEdition
      ? ([
          "purple",
          editionState === "preparing"
            ? "Preparing"
            : verifyingEdition
              ? "Verifying"
              : editionState === "applying"
                ? "Applying"
                : "Downloading",
        ] as const)
      : vs.installed
        ? ([
            "brand",
            editionRunning
              ? "Running"
              : editionLaunching
                ? "Launching"
                : "Installed",
          ] as const)
        : queuedFor
          ? ([editionState === "failed" ? "amber" : "steel", "Queued"] as const)
          : editionState === "failed"
            ? (["amber", "Failed"] as const)
            : (["steel", "Paused"] as const);

  const seasonTags = (
    <>
      {vs.installed || vs.partial || transferring || queuedFor ? (
        <SplitTag
          variant={tagVariant}
          left={`${season.sizeGb} GB`}
          right={tagRight}
        />
      ) : (
        <Tag size="md">{season.sizeGb} GB</Tag>
      )}
      {!hmActive && operatorsLocked(season.key) && (
        <Tag size="md" variant="amber">
          Locked operators
        </Tag>
      )}
    </>
  );

  const info = SEASON_INFO[season.key];
  const tabs: TabItem<TabId>[] = [
    { id: "manage", label: "Manage" },
    ...(hmActive || info ? [{ id: "info" as const, label: "Info" }] : []),
  ];

  return (
    <>
      <div
        className={
          tab === "info"
            ? "flex flex-col"
            : "flex h-[max(calc(100dvh_-_var(--topbar-h)_-_2*var(--page-pad)),30rem)] flex-col"
        }
      >
        <BackHeading title={seasonTitle(season, hmActive)} onBack={onBack} />

        <div className="relative mb-3 h-[214px] min-h-[160px] overflow-hidden rounded-lg border border-border">
          <CardCover
            season={{ ...season, hm: hmActive }}
            sizes="100vw"
            priority
          />

          <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2">
            {seasonTags}
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
          <div className="mt-4 flex items-center gap-3">
            <span className="flex flex-wrap items-center gap-2">
              {transferring ? (
                transferActions
              ) : vs.installed ? (
                <>
                  {playButtons()}
                  {verifyButton()}
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
                      disabled={running}
                      onClick={() => setModal({ kind: "shears" })}
                    >
                      Shears
                    </Button>
                  )}
                </>
              ) : queuedFor ? (
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
                      if (vs.partial) startDownload();
                      else openDownloadPrompt();
                    }}
                  >
                    {busy
                      ? "Queue download"
                      : vs.partial
                        ? "Continue"
                        : "Download"}
                  </Button>
                  {vs.partial && (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setModal({ kind: "removeDownload", hm: hmActive })
                      }
                    >
                      Remove
                    </Button>
                  )}
                  {!vs.partial &&
                    (hmActive
                      ? installs.tb.installed
                      : installs.hm.installed) && (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          guardBusy(() =>
                            setModal(
                              hmActive
                                ? { kind: "switchToHeatedMetal" }
                                : { kind: "switchToThrowback" },
                            ),
                          )
                        }
                      >
                        {hmActive ? "Switch to HM" : "Switch to TB"}
                      </Button>
                    )}
                </>
              )}
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-3">
              <TransferBar active={transferring} state={editionState} />
              <TransferPercent state={editionState} />
            </span>
            {!transferring && (
              <span
                className={`${panel} flex shrink-0 items-center gap-1 p-[0.2rem]`}
              >
                <button
                  type="button"
                  aria-label="Open folder"
                  disabled={!vs.installed}
                  onClick={() =>
                    onBridgeReady((bridge) =>
                      bridge.info.open_season(season.key, hmActive),
                    )
                  }
                  className={iconButton}
                >
                  <FolderIcon />
                </button>
                <button
                  type="button"
                  aria-label="Uninstall"
                  disabled={!vs.installed || running}
                  onClick={() => setModal({ kind: "uninstall", hm: hmActive })}
                  className={iconButton}
                >
                  <RemoveIcon />
                </button>
              </span>
            )}
          </div>
        )}

        {tab === "info" ? (
          <div className="mt-4">
            {hmActive ? (
              <SeasonInfo
                entry={{
                  ...HM_INFO,
                  release: info?.release ?? "",
                  note: season.hmBeta ? (
                    <>
                      The Heated Metal beta build comes from the{" "}
                      <ExternalLink href={site.indevReleasesUrl}>
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
            active={transferring}
            state={editionState}
          />
        )}
      </div>

      {modal?.kind === "download" && (
        <Dialog
          title="Download"
          onClose={() => setModal(null)}
          onConfirm={() => startDownload(dlLibrary)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(null)}>
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
                onClick={() => startDownload(dlLibrary)}
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

      {modal?.kind === "removeDownload" && (
        <ConfirmModal
          title="Remove download"
          confirmLabel="Remove"
          onConfirm={() => {
            const hm = modal.hm;
            setModal(null);
            dl.deletePartial(season.key, hm);
          }}
          onCancel={() => setModal(null)}
        >
          <p className="text-body text-text-muted">
            This permanently removes the partially downloaded files.
          </p>
        </ConfirmModal>
      )}

      {modal?.kind === "switchToHeatedMetal" && (
        <ConfirmModal
          title="Switch to Heated Metal"
          confirmLabel={season.hmBeta ? "Choose archive" : "Switch"}
          onConfirm={() => {
            setModal(null);
            dl.switchToHm(season.key);
          }}
          onCancel={() => setModal(null)}
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

      {modal?.kind === "switchToThrowback" && (
        <ConfirmModal
          title="Switch to Throwback"
          confirmLabel="Switch"
          onConfirm={() => {
            setModal(null);
            dl.removeHm(season.key);
          }}
          onCancel={() => setModal(null)}
        >
          <p className="text-body text-text-muted">
            This switches your Heated Metal install to Throwback.
          </p>
        </ConfirmModal>
      )}

      {modal?.kind === "shears" && (
        <ShearsModal season={season} onClose={() => setModal(null)} />
      )}

      {modal?.kind === "uninstall" && (
        <UninstallModal
          season={season}
          hm={modal.hm}
          onClose={() => setModal(null)}
          onDone={refreshInstalls}
        />
      )}
    </>
  );
}
