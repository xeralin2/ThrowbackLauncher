"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { InfoHint } from "@/components/InfoHint";
import { panel } from "@/components/ui";
import { SupportedSeasons } from "@/components/SupportedSeasons";
import { Switch } from "@/components/Switch";
import { Tabs, type TabItem } from "@/components/Tabs";
import {
  onBridgeEvent,
  type GametypeNode,
  type LiberatorCapabilities,
  useLiberator,
  useSettings,
} from "@/lib/bridge";

const session = {
  mods: {} as Record<string, boolean>,
  path: [] as number[],
};

if (typeof window !== "undefined") {
  onBridgeEvent("liberator", (event, args) => {
    if (event === "state" && !(args[0] as { attached: boolean }).attached) {
      session.mods = {};
      session.path = [];
    }
  });
}

type Mod = { key: keyof LiberatorCapabilities; label: string; hint?: string };

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

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
        {hint && <InfoHint text={hint} />}
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
                  className={`flex w-full items-center gap-1.5 rounded-md border-l-2 border-transparent px-2 py-1 text-left text-ui font-bold transition-colors ${
                    chosen
                      ? "bg-action-dim text-text"
                      : active
                        ? "bg-surface-2 text-text"
                        : "text-text-muted hover:bg-surface-2 hover:text-text"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate-fade">
                    {node.text}
                  </span>
                  {branch && <ChevronIcon />}
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

function GroupBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={panel}>
      <div className="px-4 pt-3 font-mono text-label uppercase tracking-[0.12em] text-text-muted">
        {title}
      </div>
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
  const controlsEnabled = lib.applied && !!caps.fullFeature;
  const [prevControlsEnabled, setPrevControlsEnabled] =
    useState(controlsEnabled);

  if (lib.attached !== prevAttached) {
    setPrevAttached(lib.attached);
    if (!lib.attached) {
      setMods({});
      setLastPicked("");
      setColumnPath([]);
    }
  }

  if (controlsEnabled !== prevControlsEnabled) {
    setPrevControlsEnabled(controlsEnabled);
    setTab(controlsEnabled ? "playlist" : "support");
  }

  useEffect(() => {
    session.mods = mods;
    session.path = columnPath;
  }, [mods, columnPath]);

  useEffect(() => {
    if (!lastPicked) return;
    const timer = setTimeout(() => setLastPicked(""), 5000);
    return () => clearTimeout(timer);
  }, [lastPicked]);

  const tabs: TabItem<TabId>[] = [
    { id: "playlist", label: "Playlist", disabled: !controlsEnabled },
    { id: "modifications", label: "Modifications", disabled: !controlsEnabled },
    { id: "support", label: "Support" },
  ];

  function toggleMod(key: string, checked: boolean) {
    setMods({ ...mods, [key]: checked });
    lib.setMod(key, checked);
  }

  function pickGametype(id: string) {
    setLastPicked(id);
    lib.setPlaylist(id);
  }

  const renderGroup = (group: (typeof LEFT_GROUPS)[number]) => (
    <GroupBox key={group.title} title={group.title}>
      <div className="p-2 pt-1">
        {group.mods.map((mod) => (
          <ModToggle
            key={mod.key}
            label={mod.label}
            checked={!!mods[mod.key]}
            disabled={!controlsEnabled || !caps[mod.key]}
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
                      disabled={!controlsEnabled || !caps.infiniteTime}
                      onToggle={(value) => toggleMod("infiniteTime", value)}
                    />
                    <ModToggle
                      label="Brain-Dead AI"
                      checked={!!mods.disableAI}
                      disabled={!controlsEnabled || !caps.disableAI}
                      onToggle={(value) => toggleMod("disableAI", value)}
                      hint="Enable this before the match starts."
                    />
                    <div className="mt-3 flex gap-2 px-2 pb-2">
                      <Button
                        variant="secondary"
                        disabled={!controlsEnabled || !caps.endRound}
                        onClick={lib.endRound}
                      >
                        End round
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={!controlsEnabled || !caps.endMatch}
                        onClick={lib.endMatch}
                      >
                        End match
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

        {tab === "playlist" && controlsEnabled && lib.tree && (
          <div className={`h-full overflow-hidden ${panel}`}>
            <PlaylistColumns
              roots={lib.tree}
              path={columnPath}
              lastPicked={lastPicked}
              onPick={pickGametype}
              onPath={setColumnPath}
            />
          </div>
        )}

        {tab === "support" && <SupportedSeasons />}
      </div>
    </div>
  );
}
