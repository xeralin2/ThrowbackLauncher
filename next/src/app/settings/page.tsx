"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Button, iconButton, iconButtonDanger } from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Dialog } from "@/components/Dialog";
import { Note } from "@/components/Note";
import {
  AccentPicker,
  Row,
  SaveCheck,
  Stepper,
  SwatchPicker,
  TextSetting,
} from "@/components/SettingsControls";
import { Switch } from "@/components/Switch";
import { RvpnCard } from "@/components/RvpnCard";
import { Tabs, type TabItem } from "@/components/Tabs";
import { codeChip, Tag } from "@/components/Tag";
import { TrashIcon } from "@/components/TrashIcon";
import { VersionChip } from "@/components/VersionChip";
import { BAR_PRESETS } from "@/config/accents";
import { usePlatformView } from "@/lib/platform-view";
import { useTopbarSlot } from "@/lib/topbar-slot";
import {
  onBridgeReady,
  useDiskUsage,
  useInfo,
  useLibraries,
  useSettings,
  type LibraryEntry,
  type ProtonOption,
} from "@/lib/bridge";

function FolderIcon() {
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
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function StarIcon() {
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
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </svg>
  );
}

function ResetIcon() {
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
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  );
}

function SaveField({
  label,
  value,
  confirm,
  onSave,
}: {
  label: string;
  value: string;
  confirm: number;
  onSave: (value: string) => void;
}) {
  return (
    <Row label={label}>
      <div className="relative w-[230px] min-w-0">
        <TextSetting
          value={value}
          className="w-full pr-8"
          onCommit={(draft) => {
            if (draft.trim() !== value) onSave(draft.trim());
          }}
        />
        <SaveCheck confirm={confirm} />
      </div>
    </Row>
  );
}

type TabId = "downloads" | "extra";

export default function SettingsPage() {
  const settings = useSettings();
  const info = useInfo();
  const diskUsageGb = useDiskUsage();
  const [libraries] = useLibraries();
  const [removeTarget, setRemoveTarget] = useState<LibraryEntry | null>(null);
  const [usernameSaved, setUsernameSaved] = useState(0);
  const [usernameRevert, setUsernameRevert] = useState(0);
  const [protons, setProtons] = useState<ProtonOption[] | null>(null);
  const [protonOpen, setProtonOpen] = useState(false);
  const [tab, setTab] = useState<TabId>("downloads");
  const platform = usePlatformView();
  const slot = useTopbarSlot();

  useEffect(() => {
    if (platform === "linux" && settings) settings.proton_options(setProtons);
  }, [platform, settings]);

  useEffect(() => {
    if (!settings) return;
    const onUsernameSaved = () => setUsernameSaved((tick) => tick + 1);
    const onInvalid = (field: string) => {
      if (field === "username") setUsernameRevert((tick) => tick + 1);
    };
    settings.username_changed.connect(onUsernameSaved);
    settings.invalid_setting.connect(onInvalid);
    return () => {
      settings.username_changed.disconnect(onUsernameSaved);
      settings.invalid_setting.disconnect(onInvalid);
    };
  }, [settings]);

  const tabs: TabItem<TabId>[] = [
    { id: "downloads", label: "Downloads" },
    { id: "extra", label: "Extra" },
  ];

  return (
    <>
      {slot &&
        info &&
        createPortal(<VersionChip version={info.version} />, slot)}
      <Tabs tabs={tabs} active={tab} onSelect={setTab} />

      {!settings ? (
        <p className="mt-5 font-mono text-ui text-text-muted">Loading…</p>
      ) : (
        <div className="mt-5">
          {tab === "downloads" && (
            <div className="grid max-w-[1160px] grid-cols-2 gap-4 max-[75em]:grid-cols-1">
              <div className="flex flex-col gap-4">
                <div className="rounded-lg border border-border bg-surface px-5 py-[0.85rem]">
                  <SaveField
                    key={`username:${usernameRevert}`}
                    label="Username"
                    value={settings.username}
                    confirm={usernameSaved}
                    onSave={(value) => settings.set_username(value)}
                  />
                </div>
                <div className="rounded-lg border border-border bg-surface px-5 py-[0.85rem]">
                  <Row label="Steam session">
                    {settings.steam_account ? (
                      <div className="flex min-w-0 items-center gap-3">
                        <code className={`${codeChip} truncate text-center`}>
                          {settings.steam_account}
                        </code>
                        <Button
                          variant="secondary"
                          className="shrink-0"
                          onClick={() => settings.logout()}
                        >
                          Log out
                        </Button>
                      </div>
                    ) : (
                      <Note>
                        <Link href="/download">Download</Link> a season to log
                        in.
                      </Note>
                    )}
                  </Row>
                  <Row
                    label="Discord presence"
                    hint="Display the season you are playing as a Discord activity."
                  >
                    <Switch
                      label="Discord presence"
                      checked={settings.discord_rpc}
                      onChange={(value) => settings.set_discord_rpc(value)}
                    />
                  </Row>
                </div>
                {platform === "linux" && (
                  <div className="rounded-lg border border-border bg-surface px-5 py-[0.85rem]">
                    <Row
                      label="Proton"
                      hint="Proton is a compatibility layer that runs Windows games on Linux."
                    >
                      {protons === null ? (
                        <span className="font-mono text-body text-text-muted">
                          …
                        </span>
                      ) : protons.length === 0 ? (
                        <Note>No Proton installation was found.</Note>
                      ) : (
                        <button
                          type="button"
                          aria-label="Change Proton version"
                          onClick={() => setProtonOpen(true)}
                          className="flex w-[230px] min-w-0 items-center rounded-md border border-border bg-surface-2 px-3 py-[0.4rem] text-left transition hover:border-action-edge"
                        >
                          <span className="min-w-0 grow truncate-fade font-mono text-ui text-text">
                            {protons.find((p) => p.internal === settings.proton)
                              ?.display ?? settings.proton}
                          </span>
                        </button>
                      )}
                    </Row>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-4">
                <div className="rounded-lg border border-border bg-surface px-5 py-[0.85rem]">
                  <Row
                    label="Parallel downloads"
                    hint="How many file chunks are downloaded at the same time. A higher value can be faster, but uses more bandwidth and system resources."
                  >
                    <Stepper
                      label="Parallel downloads"
                      value={settings.max_downloads}
                      min={settings.download_bounds.min}
                      max={settings.download_bounds.max}
                      onCommit={(value) => settings.set_max_downloads(value)}
                    />
                  </Row>
                  <Row
                    label="App cache"
                    hint="Clear the App cache to free up space. The files are downloaded again when needed."
                  >
                    <Button
                      variant="secondary"
                      onClick={() => settings.clear_cache()}
                    >
                      Clear
                    </Button>
                  </Row>
                </div>
                <div className="rounded-lg border border-border bg-surface px-5 py-[0.85rem]">
                  <Row label="Disk usage">
                    <code className={codeChip}>
                      {diskUsageGb != null ? `${diskUsageGb} GB` : "…"}
                    </code>
                  </Row>
                  <Row label="Libraries">
                    <Button
                      variant="secondary"
                      onClick={() => settings.add_library()}
                    >
                      Add library
                    </Button>
                  </Row>
                  <div className="flex flex-col gap-2 pb-1">
                    {(libraries ?? []).map((library) => (
                      <div
                        key={library.path}
                        className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2"
                      >
                        <span
                          title={library.path}
                          className="min-w-0 grow truncate-fade font-mono text-label text-text"
                        >
                          {library.display}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {library.default && <Tag>Default</Tag>}
                          {!library.exists && (
                            <Tag variant="amber">Not found</Tag>
                          )}
                          <span className="flex items-center gap-1">
                            <button
                              type="button"
                              aria-label={`Open ${library.display}`}
                              disabled={!library.exists}
                              onClick={() =>
                                onBridgeReady((bridge) =>
                                  bridge.info.open_library(library.path),
                                )
                              }
                              className={iconButton}
                            >
                              <FolderIcon />
                            </button>
                            {!library.default && (
                              <button
                                type="button"
                                aria-label="Make default"
                                disabled={!library.exists}
                                onClick={() =>
                                  settings.set_default_library(library.path)
                                }
                                className={iconButton}
                              >
                                <StarIcon />
                              </button>
                            )}
                            {!library.default && !library.fixed && (
                              <button
                                type="button"
                                aria-label={`Remove ${library.display}`}
                                onClick={() =>
                                  library.seasons > 0
                                    ? setRemoveTarget(library)
                                    : settings.remove_library(library.path)
                                }
                                className={iconButtonDanger}
                              >
                                <TrashIcon />
                              </button>
                            )}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "extra" && (
            <div className="grid max-w-[1160px] grid-cols-2 items-start gap-4 max-[75em]:grid-cols-1">
              <div className="rounded-lg border border-border bg-surface px-5 py-[0.85rem]">
                <div className="grid min-h-[2.75rem] grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <span className="flex justify-start">
                    <SwatchPicker
                      label="Progress bar color"
                      colors={BAR_PRESETS.map((preset) => preset.fill)}
                      value={settings.bar_fill}
                      onSelect={(value) => settings.set_bar_fill(value)}
                    />
                  </span>
                  <span className="font-display text-[1.05rem] font-bold text-text">
                    Progress bar
                  </span>
                  <span className="flex justify-end">
                    <SwatchPicker
                      label="Stripe color"
                      colors={BAR_PRESETS.map((preset) => preset.stripe)}
                      value={settings.bar_stripe}
                      onSelect={(value) => settings.set_bar_stripe(value)}
                    />
                  </span>
                </div>
                <div className="flex h-5 items-center pb-1">
                  <div className="h-3 flex-1 rounded-full border border-border bg-well">
                    <div className="transfer-fill h-full w-[70%] rounded-full" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center self-stretch rounded-lg border border-border bg-surface px-5 py-[0.85rem]">
                <div className="flex min-h-[2.75rem] items-center justify-between gap-4">
                  <span className="flex items-center gap-1">
                    <span className="font-display text-[1.05rem] font-bold text-text">
                      Accent
                    </span>
                    <button
                      type="button"
                      aria-label="Reset accent to default"
                      onClick={() => settings.reset_accent()}
                      className={iconButton}
                    >
                      <ResetIcon />
                    </button>
                  </span>
                  <AccentPicker
                    value={settings.accent}
                    onCommit={(hex) => settings.set_accent(hex)}
                  />
                </div>
              </div>
              {platform === "linux" && <RvpnCard />}
            </div>
          )}
        </div>
      )}

      {removeTarget && (
        <ConfirmModal
          title="Remove library"
          confirmLabel="Remove"
          onConfirm={() => {
            settings?.remove_library(removeTarget.path);
            setRemoveTarget(null);
          }}
          onCancel={() => setRemoveTarget(null)}
        >
          <p className="text-body text-text-muted">
            {`This library contains ${removeTarget.seasons} ${
              removeTarget.seasons === 1 ? "season" : "seasons"
            } that will no longer appear in the Launcher. `}
            No files will be deleted.
          </p>
        </ConfirmModal>
      )}

      {protonOpen && settings && protons && (
        <Dialog title="Proton" onClose={() => setProtonOpen(false)}>
          <div className="flex flex-col gap-2">
            {protons.map((proton) => {
              const selected = settings.proton === proton.internal;
              return (
                <button
                  key={proton.internal}
                  type="button"
                  onClick={() => {
                    settings.set_proton(proton.internal);
                    setProtonOpen(false);
                  }}
                  className={`flex items-center justify-between gap-3 rounded-md border bg-surface-2 px-3 py-2 text-left transition ${
                    selected
                      ? "border-action-edge shadow-[0_2px_18px_var(--color-action-glow)]"
                      : "border-border hover:border-action-edge"
                  }`}
                >
                  <span className="min-w-0 grow truncate-fade font-mono text-label text-text">
                    {proton.display}
                  </span>
                  {selected && <Tag>Selected</Tag>}
                </button>
              );
            })}
          </div>
        </Dialog>
      )}
    </>
  );
}
