"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { InfoHint } from "@/components/InfoHint";
import { Prose } from "@/components/Prose";
import { SeasonTable } from "@/components/SeasonTable";
import { Switch } from "@/components/Switch";
import { Tabs, type TabItem } from "@/components/Tabs";
import {
  onBridgeEvent,
  type GametypeNode,
  type LiberatorCapabilities,
  useLiberator,
  useSettings,
} from "@/lib/bridge";
import {
  SUPPORTED_Y12,
  SUPPORTED_Y34,
  UNLOCK_ALL_SEASONS,
} from "@/config/liberator-builds";

const session = {
  mods: {} as Record<string, boolean>,
  path: [] as number[],
};

function updateSession(patch: Partial<typeof session>) {
  Object.assign(session, patch);
}

function resetSession() {
  updateSession({ mods: {}, path: [] });
}

if (typeof window !== "undefined") {
  onBridgeEvent("liberator", (event, args) => {
    if (event === "state" && !(args[0] as { attached: boolean }).attached) {
      resetSession();
    }
  });
}

type Mod = { key: keyof LiberatorCapabilities; label: string; hint?: string };

const LEFT_GROUPS: { title: string; mods: Mod[] }[] = [
  {
    title: "Players",
    mods: [
      {
        key: "deathless",
        label: "Deathless Players and Hostage",
        hint: "Players and the hostage survive most damage.",
      },
      {
        key: "unlimitedEquip",
        label: "Unlimited Equipment",
        hint: "Gives every player unlimited equipment and reinforcements.",
      },
      {
        key: "unlimitedAmmo",
        label: "Unlimited Ammo",
        hint: "Gives every player unlimited ammo with no reloading. Enable it before spawning. It can be buggy.",
      },
    ],
  },
];

const RIGHT_GROUPS: { title: string; mods: Mod[] }[] = [
  {
    title: "Loadout",
    mods: [
      { key: "disablePrimary", label: "Disable Primary Weapon" },
      { key: "disableSecondary", label: "Disable Secondary Weapon" },
      { key: "disablePrimaryGadget", label: "Disable Primary Gadget" },
      { key: "disableSecondaryGadget", label: "Disable Secondary Gadget" },
    ],
  },
  {
    title: "Display",
    mods: [
      {
        key: "displayBuild",
        label: "Build Number",
        hint: "Displays the build number in R6S. Toggle the Display Mode once in the R6S Options menu to make it appear.",
      },
    ],
  },
];

type TabId = "playlist" | "modifications" | "support";

function ModToggle({
  label,
  checked,
  disabled,
  onToggle,
  hint,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onToggle: (value: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <span className="flex flex-1 items-center gap-1.5 text-ui text-text">
        {label}
        {hint && <InfoHint text={hint} align="left" />}
      </span>
      <Switch
        label={label}
        checked={checked}
        onChange={onToggle}
        disabled={disabled}
      />
    </div>
  );
}

function PlaylistColumns({
  roots,
  path,
  lastPicked,
  onPick,
  onPath,
}: {
  roots: GametypeNode[];
  path: number[];
  lastPicked: string;
  onPick: (id: string) => void;
  onPath: (path: number[]) => void;
}) {
  const activePath =
    path.length === 0 && (roots[0]?.children.length ?? 0) > 0 ? [0] : path;

  const columns: GametypeNode[][] = [roots];
  let current: GametypeNode[] = roots;
  for (const index of activePath) {
    const next = current[index];
    if (!next || next.children.length === 0) break;
    columns.push(next.children);
    current = next.children;
  }

  return (
    <div className="flex h-full overflow-x-auto">
      {columns.map((nodes, col) => (
        <ul
          key={col}
          className="min-w-[150px] flex-1 overflow-y-auto border-r border-border p-2 last:border-r-0"
        >
          {nodes.map((node, index) => {
            const branch = node.children.length > 0;
            const active = branch && activePath[col] === index;
            const chosen = !branch && node.id === lastPicked;
            return (
              <li key={`${col}:${index}`}>
                <button
                  type="button"
                  onClick={() =>
                    branch
                      ? onPath([...activePath.slice(0, col), index])
                      : leaf(col, node.id)
                  }
                  className={`flex w-full items-center gap-1.5 rounded-md border-l-2 px-2 py-1 text-left text-ui font-bold transition-colors ${
                    chosen
                      ? "border-transparent bg-brand-dim text-text"
                      : active
                        ? "border-transparent bg-surface-2 text-text"
                        : "border-transparent text-text-muted hover:bg-surface-2 hover:text-text"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate-fade">
                    {node.text}
                  </span>
                  {branch && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="9 6 15 12 9 18" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ))}
    </div>
  );

  function leaf(col: number, id: string) {
    onPath(activePath.slice(0, col));
    onPick(id);
  }
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 pt-3 font-mono text-label uppercase tracking-[0.12em] text-text-muted">
      {children}
    </div>
  );
}

function GroupBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface">
      <GroupLabel>{title}</GroupLabel>
      {children}
    </div>
  );
}

export default function LiberatorPage() {
  const settings = useSettings();
  const lib = useLiberator();

  const [mods, setMods] = useState<Record<string, boolean>>(session.mods);
  const [lastPicked, setLastPicked] = useState("");
  const [columnPath, setColumnPath] = useState<number[]>(session.path);
  const [tab, setTab] = useState<TabId>("support");
  const [prevAttached, setPrevAttached] = useState(lib.attached);

  const caps = lib.capabilities;
  const modsEnabled = lib.applied && !!caps.fullFeature;
  const playlistEnabled = lib.applied && !!caps.fullFeature;
  const [prevPlaylistEnabled, setPrevPlaylistEnabled] =
    useState(playlistEnabled);

  if (lib.attached !== prevAttached) {
    setPrevAttached(lib.attached);
    if (!lib.attached) {
      setMods({});
      setLastPicked("");
      setColumnPath([]);
    }
  }

  if (playlistEnabled !== prevPlaylistEnabled) {
    setPrevPlaylistEnabled(playlistEnabled);
    setTab(playlistEnabled ? "playlist" : "support");
  }

  useEffect(() => {
    if (!lastPicked) return;
    const timer = setTimeout(() => setLastPicked(""), 5000);
    return () => clearTimeout(timer);
  }, [lastPicked]);

  const tabs: TabItem<TabId>[] = [
    { id: "playlist", label: "Playlist", disabled: !playlistEnabled },
    { id: "modifications", label: "Modifications", disabled: !modsEnabled },
    { id: "support", label: "Support" },
  ];

  function toggleMod(key: string, checked: boolean) {
    const next = { ...session.mods, [key]: checked };
    updateSession({ mods: next });
    setMods(next);
    lib.setMod(key, checked);
  }

  function pickGametype(id: string) {
    setLastPicked(id);
    lib.setPlaylist(id);
  }

  function updatePath(path: number[]) {
    updateSession({ path });
    setColumnPath(path);
  }

  const renderGroup = (group: (typeof LEFT_GROUPS)[number]) => (
    <GroupBox key={group.title} title={group.title}>
      <div className="p-2 pt-1">
        {group.mods.map((mod) => (
          <ModToggle
            key={mod.key}
            label={mod.label}
            checked={!!mods[mod.key]}
            disabled={!modsEnabled || !caps[mod.key]}
            onToggle={(value) => toggleMod(mod.key, value)}
            hint={mod.hint}
          />
        ))}
      </div>
    </GroupBox>
  );

  return (
    <div className="flex h-full flex-col">
      <Tabs
        tabs={tabs}
        active={tab}
        onSelect={setTab}
        trailing={
          <span className="flex items-center gap-2.5 pb-2 font-display text-[1.05rem] font-bold text-text">
            {!(settings?.liberator_enabled ?? true) ? (
              <span className="text-text-muted">Disabled</span>
            ) : !lib.available ? (
              <span className="text-text-muted">Not found in this build</span>
            ) : lib.attached ? (
              lib.status || "Attached"
            ) : (
              "Waiting for R6S to launch"
            )}
            <Switch
              label="Liberator"
              checked={settings?.liberator_enabled ?? true}
              onChange={(value) => settings?.set_liberator_enabled(value)}
            />
          </span>
        }
      />

      <div className="mt-4 min-h-0 flex-1">
        {tab === "modifications" && (
          <div className="max-w-[720px]">
            <div className="grid grid-cols-2 gap-3 max-[40em]:grid-cols-1">
              <div className="flex flex-col gap-3">
                {LEFT_GROUPS.map(renderGroup)}

                <GroupBox title="Match">
                  <div className="p-2 pt-1">
                    <ModToggle
                      label="Infinite Match Time"
                      checked={!!mods.infiniteTime}
                      disabled={!modsEnabled || !caps.infiniteTime}
                      onToggle={(value) => toggleMod("infiniteTime", value)}
                    />
                    <ModToggle
                      label="Brain-Dead AI"
                      checked={!!mods.disableAI}
                      disabled={!modsEnabled || !caps.disableAI}
                      onToggle={(value) => toggleMod("disableAI", value)}
                      hint="Enable this before the match starts."
                    />
                    <div className="mt-3 flex gap-2 px-2 pb-2">
                      <Button
                        variant="secondary"
                        disabled={!modsEnabled || !caps.endRound}
                        onClick={lib.endRound}
                      >
                        End Round
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={!modsEnabled || !caps.endMatch}
                        onClick={lib.endMatch}
                      >
                        End Match
                      </Button>
                    </div>
                  </div>
                </GroupBox>
              </div>

              <div className="flex flex-col gap-3">
                {RIGHT_GROUPS.map(renderGroup)}
              </div>
            </div>
          </div>
        )}

        {tab === "playlist" && playlistEnabled && lib.tree && (
          <div className="h-full overflow-hidden rounded-lg border border-border bg-surface">
            <PlaylistColumns
              roots={lib.tree}
              path={columnPath}
              lastPicked={lastPicked}
              onPick={pickGametype}
              onPath={updatePath}
            />
          </div>
        )}

        {tab === "support" && (
          <Prose>
            <div className="flex flex-wrap items-start gap-x-6">
              <SeasonTable rows={SUPPORTED_Y12} />
              <SeasonTable rows={SUPPORTED_Y34} showEvent />
              <SeasonTable rows={UNLOCK_ALL_SEASONS} />
            </div>
          </Prose>
        )}
      </div>
    </div>
  );
}
