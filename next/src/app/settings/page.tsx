"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Button, buttonVariants, iconButton } from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Dialog } from "@/components/Dialog";
import { Note } from "@/components/Note";
import { card, fieldRow, ListRow } from "@/components/ui";
import {
  AccentPicker,
  ColorRow,
  HexSetting,
  Row,
  SaveCheck,
  Stepper,
  TextSetting,
} from "@/components/SettingsControls";
import { Switch } from "@/components/Switch";
import { RvpnCard } from "@/components/RvpnCard";
import { Tabs, type TabItem } from "@/components/Tabs";
import { Tag } from "@/components/Tag";
import { FolderIcon } from "@/components/FolderIcon";
import { RemoveIcon } from "@/components/RemoveIcon";
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

function StarIcon() {
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
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </svg>
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
    settings.settings_error.connect(onInvalid);
    return () => {
      settings.username_changed.disconnect(onUsernameSaved);
      settings.settings_error.disconnect(onInvalid);
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
        <p className="mt-5 animate-pulse font-mono text-ui text-text-muted">
          Loading
        </p>
      ) : (
        <div className="mt-5">
          {tab === "downloads" && (
            <div className="grid max-w-[1160px] grid-cols-2 gap-4 max-[75em]:grid-cols-1">
              <div className="flex flex-col gap-4">
                <div className={card}>
                  <Row key={`username:${usernameRevert}`} label="Username">
                    <div className="relative w-[230px] min-w-0">
                      <TextSetting
                        value={settings.username}
                        className="w-full pr-8"
                        onCommit={(draft) => {
                          if (draft.trim() !== settings.username)
                            settings.set_username(draft.trim());
                        }}
                      />
                      <SaveCheck confirm={usernameSaved} />
                    </div>
                  </Row>
                </div>
                <div className={card}>
                  <Row label="Steam session">
                    {settings.steam_account ? (
                      <div className="flex min-w-0 items-center gap-3">
                        <code className="truncate text-center">
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
                {platform === "linux" && <RvpnCard />}
              </div>
              <div className="flex flex-col gap-4">
                <div className={card}>
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
                {platform === "linux" && (
                  <div className={card}>
                    <Row
                      label="Proton"
                      hint="Proton is a compatibility layer that runs Windows games on Linux."
                    >
                      {protons === null ? null : protons.length === 0 ? (
                        <Note>No Proton installation was found.</Note>
                      ) : (
                        <button
                          type="button"
                          aria-label="Change Proton version"
                          onClick={() => setProtonOpen(true)}
                          className="flex h-8 w-[230px] min-w-0 items-center rounded-md border border-border bg-surface-2 px-[0.4rem] text-left transition hover:border-action-edge"
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
                <div className={card}>
                  <div className="flex flex-col gap-2">
                    <Row label="Libraries">
                      <div className="flex min-w-0 items-center gap-3">
                        {diskUsageGb != null && <code>{diskUsageGb} GB</code>}
                        <Button
                          variant="secondary"
                          className="shrink-0"
                          onClick={() => settings.add_library()}
                        >
                          Add library
                        </Button>
                      </div>
                    </Row>
                    {(libraries ?? []).map((library) => (
                      <ListRow
                        key={library.path}
                        label={library.display}
                        title={library.path}
                      >
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
                                className={iconButton}
                              >
                                <RemoveIcon />
                              </button>
                            )}
                          </span>
                        </span>
                      </ListRow>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "extra" && (
            <div className="grid max-w-[1160px] grid-cols-2 items-start gap-4 max-[75em]:grid-cols-1">
              <div className={`${card} justify-center self-stretch`}>
                <div className="grid grid-cols-2 gap-3">
                  <span className="flex h-6 items-center font-display text-[1.05rem] font-bold text-text">
                    Progress bar
                  </span>
                  <span className="row-span-2 flex min-w-0 flex-col justify-between">
                    <ColorRow
                      label="Progress bar color"
                      colors={BAR_PRESETS.map((preset) => preset.fill)}
                      value={settings.bar_fill}
                      onSelect={(value) => settings.set_bar_fill(value)}
                    />
                    <ColorRow
                      label="Stripe color"
                      colors={BAR_PRESETS.map((preset) => preset.stripe)}
                      value={settings.bar_stripe}
                      onSelect={(value) => settings.set_bar_stripe(value)}
                    />
                  </span>
                  <div className="flex h-6 items-center">
                    <div className="h-3.5 flex-1 rounded-full border border-border bg-well">
                      <div className="transfer-fill h-full w-[70%] rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
              <div className={`${card} justify-center self-stretch`}>
                <div className="grid grid-cols-2 gap-3">
                  <span className="flex h-6 items-center font-display text-[1.05rem] font-bold text-text">
                    Accent
                  </span>
                  <span className="row-span-2 min-w-0">
                    <AccentPicker
                      value={settings.accent}
                      onCommit={(hex) => settings.set_accent(hex)}
                    />
                  </span>
                  <span className="flex h-6 items-center gap-2">
                    <HexSetting
                      label="Accent hex code"
                      value={settings.accent}
                      onCommit={(hex) => settings.set_accent(hex)}
                    />
                    <button
                      type="button"
                      onClick={() => settings.reset_accent()}
                      className={`h-6 whitespace-nowrap rounded-md px-3 font-mono text-label tracking-[0.08em] shadow-[0_2px_14px_transparent] transition duration-200 ${buttonVariants.secondary}`}
                    >
                      Reset
                    </button>
                  </span>
                </div>
              </div>
              <div className={card}>
                <Row
                  label="Reduce motion"
                  hint="Turn off animations and transitions across the app."
                >
                  <Switch
                    label="Reduce motion"
                    checked={settings.reduce_motion}
                    onChange={(value) => settings.set_reduce_motion(value)}
                  />
                </Row>
              </div>
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
                  className={`${fieldRow} text-left transition ${
                    selected
                      ? "row-selected"
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
