"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";

export type ThrowbackOS = "linux" | "windows";

export type Season = {
  key: string;
  id: string;
  hm: boolean;
  code: string;
  name: string;
  label: string;
  sizeGb: number;
  build: string;
  hmAvailable: boolean;
  hmBeta: boolean;
  partial: boolean;
  cover: string | null;
};

type VariantRef = { key: string; hm: boolean };

export function seasonTitle(season: Season): string {
  return `${season.code} ${season.hm ? "Heated Metal" : season.name}`;
}

type QtSignal = {
  connect(callback: (...args: never[]) => void): void;
  disconnect(callback: (...args: never[]) => void): void;
};

type LibraryBridge = {
  seasons: Season[];
  home(callback: (seasons: Season[]) => void): void;
};

type InfoSnapshot = {
  version: string;
  warning: string | null;
};

type InfoBridge = {
  snapshot(callback: (info: InfoSnapshot) => void): void;
  open_library(path: string): void;
  refresh_disk_usage(): void;
  disk_usage_changed: QtSignal;
};

type VariantStatus = {
  installed: boolean;
  partial: boolean;
};

export type LaunchStatus = {
  tb: VariantStatus;
  hm: VariantStatus;
};

type LaunchObject = {
  status(key: string, callback: (status: LaunchStatus) => void): void;
  launch(key: string, hm: boolean): void;
  stop(key: string): void;
  running(callback: (refs: VariantRef[]) => void): void;
  launching(callback: (ref: Partial<VariantRef>) => void): void;
};

export type ShearsKind = "videos" | "events" | "textures";

type ShearsTier = { level: number; quality: string; size: number };

export type ShearsScan = {
  videos: number;
  events: number;
  tiers: ShearsTier[];
};

type ShearsScanResult = {
  key: string;
  ok: boolean;
  message: string;
  scan: ShearsScan;
};

type ShearsCutResult = ShearsScanResult & { freed: number };

type ShearsObject = {
  scan(key: string): void;
  cut(key: string, kind: ShearsKind, level: number): void;
};

export type UninstallTargets = {
  folder: string;
  prefix: string;
};

type UninstallObject = {
  preview(
    key: string,
    hm: boolean,
    callback: (targets: UninstallTargets) => void,
  ): void;
  run(key: string, hm: boolean): void;
  run_item(key: string, hm: boolean, item: string): void;
};

export type LibraryEntry = {
  path: string;
  display: string;
  default: boolean;
  fixed: boolean;
  exists: boolean;
  seasons: number;
};

export type ProtonOption = { internal: string; display: string };

type SettingsBridge = {
  username: string;
  steam_account: string;
  max_downloads: number;
  discord_rpc: boolean;
  home_order: string[];
  home_sizes: Record<string, string>;
  liberator_enabled: boolean;
  rvpn_autostart: boolean;
  proton: string;
  bar_fill: string;
  bar_stripe: string;
  accent: string;
  download_bounds: { min: number; max: number };
  libraries(callback: (libraries: LibraryEntry[]) => void): void;
  proton_options(callback: (protons: ProtonOption[]) => void): void;
  set_username(value: string): void;
  set_max_downloads(value: number): void;
  set_discord_rpc(value: boolean): void;
  set_home_order(order: string[]): void;
  set_home_size(key: string, width: number, height: number): void;
  reset_home_layout(): void;
  set_liberator_enabled(value: boolean): void;
  set_rvpn_autostart(value: boolean): void;
  set_proton(value: string): void;
  set_bar_fill(value: string): void;
  set_bar_stripe(value: string): void;
  set_accent(value: string): void;
  reset_accent(): void;
  add_library(): void;
  remove_library(path: string): void;
  set_default_library(path: string): void;
  logout(): void;
  clear_cache(): void;
  username_changed: QtSignal;
  steam_account_changed: QtSignal;
  max_downloads_changed: QtSignal;
  discord_rpc_changed: QtSignal;
  home_order_changed: QtSignal;
  home_sizes_changed: QtSignal;
  liberator_enabled_changed: QtSignal;
  rvpn_autostart_changed: QtSignal;
  proton_changed: QtSignal;
  bar_fill_changed: QtSignal;
  bar_stripe_changed: QtSignal;
  accent_changed: QtSignal;
  invalid_setting: QtSignal;
  logged_out: QtSignal;
  cache_cleared: QtSignal;
  libraries_changed: QtSignal;
};

type QueueEntry = { key: string; hm: boolean; verify: boolean };

type DownloaderState = {
  state: string;
  running: boolean;
  activeKey: string;
  activeHm: boolean;
  verifying: boolean;
  loginKind: string;
  queue: QueueEntry[];
};

type DownloaderSnapshot = DownloaderState & DownloadProgress;

type DownloadProgress = {
  progress: number;
  step: number;
  steps: number;
};

export function determinatePercent(
  progress: number,
  step: number,
  steps: number,
): number | null {
  return step >= steps && progress > 0 && progress < 100
    ? Math.floor(progress)
    : null;
}

type DownloaderObject = {
  start(key: string, enableHm: boolean, library: string): void;
  enqueue(key: string, enableHm: boolean, library: string): void;
  dequeue(key: string, hm: boolean): void;
  reorder_queue(refs: VariantRef[]): void;
  set_paused(value: boolean): void;
  verify(key: string, hm: boolean): void;
  delete_partial(key: string, hm: boolean): void;
  switch_to_hm(key: string): void;
  remove_hm(key: string): void;
  import_hm(key: string): void;
  cancel(): void;
  submit_login(text: string): void;
  submit_account_login(account: string, password: string): void;
  confirm_disk_space(): void;
  snapshot(callback: (snapshot: DownloaderSnapshot) => void): void;
  log_history(callback: (history: string) => void): void;
};

export type LiberatorCapabilities = {
  deathless: boolean;
  disableAI: boolean;
  unlimitedAmmo: boolean;
  unlimitedEquip: boolean;
  infiniteTime: boolean;
  disablePrimary: boolean;
  disableSecondary: boolean;
  disablePrimaryGadget: boolean;
  disableSecondaryGadget: boolean;
  displayBuild: boolean;
  endRound: boolean;
  endMatch: boolean;
  fullFeature: boolean;
};

type LiberatorState = {
  attached: boolean;
  applied: boolean;
  status: string;
  available: boolean;
  capabilities: Partial<LiberatorCapabilities>;
};

export type GametypeNode = {
  text: string;
  id: string;
  children: GametypeNode[];
};

type LiberatorObject = {
  snapshot(callback: (state: LiberatorState) => void): void;
  tree_snapshot(callback: (tree: GametypeNode[] | null) => void): void;
  set_mod(mod: string, enabled: boolean): void;
  set_playlist(playlistId: string): void;
  end_round(): void;
  end_match(): void;
};

export type UpdateComponent = {
  name: string;
  target: string;
  notes: {
    text: string;
    level: number;
    kind: "heading" | "text" | "bullet" | "number";
  }[];
};

type UpdateSnapshot = {
  busy: boolean;
  checking: boolean;
  components: UpdateComponent[];
  checkError: string;
  progress: number;
  applying: number;
};

type UpdateObject = {
  snapshot(callback: (snapshot: UpdateSnapshot) => void): void;
  check(force?: boolean): void;
  apply(index: number): void;
};

type RvpnSnapshot = {
  status: string;
  installed: boolean;
  hasInstaller: boolean;
  busy: boolean;
  progress: number;
  version: string;
};

type RvpnObject = {
  snapshot(callback: (snapshot: RvpnSnapshot) => void): void;
  select_installer(): void;
  start(): void;
  stop(): void;
  uninstall(): void;
};

export type CheatEngineSeason = {
  key: string;
  label: string;
  hasCe: boolean;
  present: boolean;
};

type CheatEngineResult = { ok: boolean; message: string };

type CheatEngineObject = {
  pick_installer(callback: (path: string) => void): void;
  seasons(callback: (seasons: CheatEngineSeason[]) => void): void;
  install(key: string): void;
  register(key: string, callback: (result: CheatEngineResult) => void): void;
  remove(key: string, callback: (result: CheatEngineResult) => void): void;
};

type Bridge = {
  library: LibraryBridge;
  info: InfoBridge;
  settings: SettingsBridge;
  downloader: DownloaderObject;
  liberator: LiberatorObject;
  rvpn?: RvpnObject;
  cheatengine?: CheatEngineObject;
  launch: LaunchObject;
  shears: ShearsObject;
  uninstall: UninstallObject;
  update: UpdateObject;
};

declare global {
  interface Window {
    throwback?: Bridge;
    __throwbackOS?: ThrowbackOS;
    __throwbackHasLocal?: boolean;
  }
}

export function onBridgeEvent(
  target: string,
  handler: (event: string, args: unknown[]) => void,
): () => void {
  function listener(raw: Event) {
    const detail = (raw as CustomEvent).detail as {
      target: string;
      event: string;
      args: unknown[];
    };
    if (detail.target === target) handler(detail.event, detail.args);
  }
  window.addEventListener("throwback:event", listener);
  return () => window.removeEventListener("throwback:event", listener);
}

export function onBridgeReady(callback: (bridge: Bridge) => void): void {
  if (window.throwback) {
    callback(window.throwback);
    return;
  }
  window.addEventListener(
    "throwback:ready",
    () => {
      if (window.throwback) callback(window.throwback);
    },
    { once: true },
  );
}

const subscribeOs = () => () => {};
const osSnapshot = () => window.__throwbackOS ?? null;
const osServerSnapshot = (): ThrowbackOS | null => null;

export function usePlatform(): ThrowbackOS | null {
  return useSyncExternalStore(subscribeOs, osSnapshot, osServerSnapshot);
}

export function useSeasons(): Season[] | null {
  const [seasons, setSeasons] = useState<Season[] | null>(null);
  useEffect(() => {
    onBridgeReady((bridge) => setSeasons(bridge.library.seasons));
  }, []);
  return seasons;
}

let homeSeasons: Season[] | null = null;
let homeStarted = false;
const homeListeners = new Set<() => void>();

function refreshHome() {
  onBridgeReady((bridge) =>
    bridge.library.home((seasons) => {
      homeSeasons = seasons;
      for (const listener of homeListeners) listener();
    }),
  );
}

function subscribeHome(listener: () => void): () => void {
  if (!homeStarted) {
    homeStarted = true;
    refreshHome();
    onBridgeReady((bridge) =>
      bridge.settings.libraries_changed.connect(refreshHome),
    );
    onBridgeEvent("downloader", (event) => {
      if (
        event === "running" ||
        event === "state" ||
        event === "done" ||
        event === "partial_deleted"
      )
        refreshHome();
    });
    onBridgeEvent("uninstall", refreshHome);
  }
  homeListeners.add(listener);
  return () => homeListeners.delete(listener);
}

export function useHomeSeasons(): [Season[] | null, () => void] {
  const seasons = useSyncExternalStore(
    subscribeHome,
    () => homeSeasons,
    () => null,
  );
  return [seasons, refreshHome];
}

export function useHasLocalSeasons(): boolean | null {
  return useSyncExternalStore(
    subscribeHome,
    () =>
      homeSeasons !== null
        ? homeSeasons.length > 0
        : (window.__throwbackHasLocal ?? null),
    () => null,
  );
}

export function useInfo(): InfoSnapshot | null {
  const [info, setInfo] = useState<InfoSnapshot | null>(null);
  useEffect(() => {
    onBridgeReady((bridge) => bridge.info.snapshot(setInfo));
  }, []);
  return info;
}

export function useDiskUsage(): number | null {
  const [gb, setGb] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    let disconnect: (() => void) | undefined;
    const refresh = () =>
      onBridgeReady((bridge) => bridge.info.refresh_disk_usage());
    onBridgeReady((bridge) => {
      if (cancelled) return;
      const onDiskUsage = (value: number) => setGb(value);
      bridge.info.disk_usage_changed.connect(onDiskUsage);
      bridge.settings.libraries_changed.connect(refresh);
      disconnect = () => {
        bridge.info.disk_usage_changed.disconnect(onDiskUsage);
        bridge.settings.libraries_changed.disconnect(refresh);
      };
      bridge.info.refresh_disk_usage();
    });
    const offDownloader = onBridgeEvent("downloader", (event) => {
      if (event === "done" || event === "partial_deleted") refresh();
    });
    const offUninstall = onBridgeEvent("uninstall", () => refresh());
    return () => {
      cancelled = true;
      disconnect?.();
      offDownloader();
      offUninstall();
    };
  }, []);
  return gb;
}

export function useSettings(): SettingsBridge | null {
  const [settings, setSettings] = useState<SettingsBridge | null>(null);
  const [, bump] = useReducer((value: number) => value + 1, 0);

  useEffect(() => {
    let cancelled = false;
    let signals: QtSignal[] = [];
    onBridgeReady((bridge) => {
      if (cancelled) return;
      const connected = bridge.settings;
      setSettings(connected);
      signals = [
        connected.username_changed,
        connected.steam_account_changed,
        connected.max_downloads_changed,
        connected.discord_rpc_changed,
        connected.home_order_changed,
        connected.home_sizes_changed,
        connected.liberator_enabled_changed,
        connected.rvpn_autostart_changed,
        connected.proton_changed,
        connected.bar_fill_changed,
        connected.bar_stripe_changed,
        connected.accent_changed,
      ];
      for (const signal of signals) signal.connect(bump);
    });
    return () => {
      cancelled = true;
      for (const signal of signals) signal.disconnect(bump);
    };
  }, []);

  return settings;
}

export function useLibraries(): [LibraryEntry[] | null, () => void] {
  const [libraries, setLibraries] = useState<LibraryEntry[] | null>(null);
  const refresh = useCallback(() => {
    onBridgeReady((bridge) => bridge.settings.libraries(setLibraries));
  }, []);

  useEffect(() => {
    refresh();
    let cancelled = false;
    let connected: SettingsBridge | null = null;
    onBridgeReady((bridge) => {
      if (cancelled) return;
      connected = bridge.settings;
      connected.libraries_changed.connect(refresh);
    });
    return () => {
      cancelled = true;
      connected?.libraries_changed.disconnect(refresh);
    };
  }, [refresh]);

  return [libraries, refresh];
}

function useBridgeHandle<K extends keyof Bridge & string>(
  name: K,
  hooks: {
    init?: (obj: Bridge[K], alive: () => boolean) => void;
    onEvent?: (event: string, args: unknown[], alive: () => boolean) => void;
  } = {},
): [RefObject<Bridge[K] | null>, boolean] {
  const [ready, setReady] = useState(false);
  const objRef = useRef<Bridge[K] | null>(null);
  const hooksRef = useRef(hooks);

  useEffect(() => {
    hooksRef.current = hooks;
  });

  useEffect(() => {
    let mounted = true;
    const alive = () => mounted;

    onBridgeReady((bridge) => {
      if (!mounted) return;
      objRef.current = bridge[name];
      setReady(bridge[name] != null);
      hooksRef.current.init?.(bridge[name], alive);
    });

    const offEvent = onBridgeEvent(name, (event, args) => {
      hooksRef.current.onEvent?.(event, args, alive);
    });
    return () => {
      mounted = false;
      offEvent();
    };
  }, [name]);

  return [objRef, ready];
}

type DownloaderEvents = {
  onLog?: (line: string) => void;
  onLogin?: (kind: string) => void;
  onDiskSpace?: (required: number, free: number) => void;
  onDone?: (key: string, outcome: string) => void;
  onPartialDeleted?: (
    key: string,
    hm: boolean,
    ok: boolean,
    message: string,
  ) => void;
};

type DownloaderActions = {
  ready: boolean;
  start: (key: string, enableHm: boolean, library: string) => void;
  enqueue: (key: string, enableHm: boolean, library: string) => void;
  dequeue: (key: string, hm: boolean) => void;
  reorderQueue: (refs: VariantRef[]) => void;
  setPaused: (value: boolean) => void;
  verify: (key: string, hm: boolean) => void;
  deletePartial: (key: string, hm: boolean) => void;
  switchToHm: (key: string) => void;
  removeHm: (key: string) => void;
  importHm: (key: string) => void;
  cancel: () => void;
  submitLogin: (text: string) => void;
  submitAccountLogin: (account: string, password: string) => void;
  confirmDiskSpace: () => void;
  loadHistory: (callback: (history: string) => void) => void;
};

type Downloader = DownloaderState & DownloaderActions;

function downloaderActions(
  objRef: RefObject<DownloaderObject | null>,
  ready: boolean,
): DownloaderActions {
  return {
    ready,
    start: (key, enableHm, library) =>
      objRef.current?.start(key, enableHm, library),
    enqueue: (key, enableHm, library) =>
      objRef.current?.enqueue(key, enableHm, library),
    dequeue: (key, hm) => objRef.current?.dequeue(key, hm),
    reorderQueue: (refs) => objRef.current?.reorder_queue(refs),
    setPaused: (value) => objRef.current?.set_paused(value),
    verify: (key, hm) => objRef.current?.verify(key, hm),
    deletePartial: (key, hm) => objRef.current?.delete_partial(key, hm),
    switchToHm: (key) => objRef.current?.switch_to_hm(key),
    removeHm: (key) => objRef.current?.remove_hm(key),
    importHm: (key) => objRef.current?.import_hm(key),
    cancel: () => objRef.current?.cancel(),
    submitLogin: (text) => objRef.current?.submit_login(text),
    submitAccountLogin: (account, password) =>
      objRef.current?.submit_account_login(account, password),
    confirmDiskSpace: () => objRef.current?.confirm_disk_space(),
    loadHistory: (callback) => objRef.current?.log_history(callback),
  };
}

export function useDownloadProgress(): DownloadProgress {
  const [progress, setProgress] = useState<DownloadProgress>({
    progress: 0,
    step: 0,
    steps: 0,
  });
  useBridgeHandle("downloader", {
    init: (obj, alive) =>
      obj.snapshot(({ progress, step, steps }) => {
        if (alive()) setProgress({ progress, step, steps });
      }),
    onEvent: (event, args) => {
      if (event === "progress") {
        setProgress({
          progress: args[0] as number,
          step: args[1] as number,
          steps: args[2] as number,
        });
      }
    },
  });
  return progress;
}

export function useDownloaderRunning(): boolean {
  const [running, setRunning] = useState(false);
  useBridgeHandle("downloader", {
    init: (obj, alive) =>
      obj.snapshot((snapshot) => {
        if (alive()) setRunning(snapshot.running);
      }),
    onEvent: (event, args) => {
      if (event === "running") setRunning(args[0] as boolean);
    },
  });
  return running;
}

export function useDownloader(events?: DownloaderEvents): Downloader {
  const [snap, setSnap] = useState<DownloaderState>({
    state: "idle",
    running: false,
    activeKey: "",
    activeHm: false,
    verifying: false,
    loginKind: "",
    queue: [],
  });
  const [objRef, ready] = useBridgeHandle("downloader", {
    init: (obj, alive) =>
      obj.snapshot((snapshot) => {
        if (alive()) setSnap(snapshot);
      }),
    onEvent: (event, args) => {
      const value = args[0];
      switch (event) {
        case "state":
          setSnap((prev) => ({ ...prev, state: value as string }));
          break;
        case "running":
          setSnap((prev) => ({ ...prev, running: value as boolean }));
          break;
        case "active_key":
          setSnap((prev) => ({ ...prev, activeKey: value as string }));
          break;
        case "active_hm":
          setSnap((prev) => ({ ...prev, activeHm: value as boolean }));
          break;
        case "verifying":
          setSnap((prev) => ({ ...prev, verifying: value as boolean }));
          break;
        case "queue":
          setSnap((prev) => ({ ...prev, queue: value as QueueEntry[] }));
          break;
        case "log_line":
          events?.onLog?.(value as string);
          break;
        case "login_required":
          events?.onLogin?.(value as string);
          break;
        case "disk_space_required":
          events?.onDiskSpace?.(args[0] as number, args[1] as number);
          break;
        case "done":
          events?.onDone?.(args[0] as string, args[1] as string);
          break;
        case "partial_deleted":
          events?.onPartialDeleted?.(
            args[0] as string,
            args[1] as boolean,
            args[2] as boolean,
            args[3] as string,
          );
          break;
      }
    },
  });

  return useMemo(
    () => ({ ...snap, ...downloaderActions(objRef, ready) }),
    [snap, ready, objRef],
  );
}

const NO_CAPABILITIES: LiberatorCapabilities = {
  deathless: false,
  disableAI: false,
  unlimitedAmmo: false,
  unlimitedEquip: false,
  infiniteTime: false,
  disablePrimary: false,
  disableSecondary: false,
  disablePrimaryGadget: false,
  disableSecondaryGadget: false,
  displayBuild: false,
  endRound: false,
  endMatch: false,
  fullFeature: false,
};

const LIBERATOR_DEFAULT: LiberatorState = {
  attached: false,
  applied: false,
  status: "",
  available: true,
  capabilities: NO_CAPABILITIES,
};

type Liberator = LiberatorState & {
  tree: GametypeNode[] | null;
  setMod: (mod: string, enabled: boolean) => void;
  setPlaylist: (id: string) => void;
  endRound: () => void;
  endMatch: () => void;
};

export function useLiberator(): Liberator {
  const [state, setState] = useState<LiberatorState>(LIBERATOR_DEFAULT);
  const [tree, setTree] = useState<GametypeNode[] | null>(null);
  const [objRef] = useBridgeHandle("liberator", {
    init: (obj, alive) => {
      obj.snapshot((snapshot) => {
        if (alive()) setState(snapshot);
      });
      obj.tree_snapshot((tree) => {
        if (alive()) setTree(tree);
      });
    },
    onEvent: (event, args) => {
      if (event === "state") {
        setState(args[0] as LiberatorState);
      } else if (event === "tree") {
        setTree(args[0] as GametypeNode[] | null);
      }
    },
  });

  return useMemo(
    () => ({
      ...state,
      tree,
      setMod: (mod, enabled) => objRef.current?.set_mod(mod, enabled),
      setPlaylist: (id) => objRef.current?.set_playlist(id),
      endRound: () => objRef.current?.end_round(),
      endMatch: () => objRef.current?.end_match(),
    }),
    [state, tree, objRef],
  );
}

type Launch = {
  ready: boolean;
  running: VariantRef[];
  launching: VariantRef | null;
  status: LaunchObject["status"];
  launch: (key: string, hm: boolean) => void;
  stop: (key: string) => void;
};

function launchingRef(value: Partial<VariantRef>): VariantRef | null {
  return typeof value.key === "string"
    ? { key: value.key, hm: !!value.hm }
    : null;
}

export function useLaunch(): Launch {
  const [running, setRunning] = useState<VariantRef[]>([]);
  const [launching, setLaunching] = useState<VariantRef | null>(null);
  const [objRef, ready] = useBridgeHandle("launch", {
    init: (obj, alive) => {
      obj.running((refs) => {
        if (alive()) setRunning(refs);
      });
      obj.launching((ref) => {
        if (alive()) setLaunching(launchingRef(ref));
      });
    },
    onEvent: (event, args) => {
      if (event === "running") setRunning(args[0] as VariantRef[]);
      else if (event === "launching")
        setLaunching(launchingRef(args[0] as Partial<VariantRef>));
    },
  });

  return useMemo(
    () => ({
      ready,
      running,
      launching,
      status: (key, callback) => objRef.current?.status(key, callback),
      launch: (key, hm) => objRef.current?.launch(key, hm),
      stop: (key) => objRef.current?.stop(key),
    }),
    [ready, running, launching, objRef],
  );
}

type Shears = {
  ready: boolean;
  scan: (key: string, callback: (result: ShearsScanResult) => void) => void;
  cut: (
    key: string,
    kind: ShearsKind,
    level: number,
    callback: (result: ShearsCutResult) => void,
  ) => void;
};

export function useShears(): Shears {
  const scanKey = useRef<string | null>(null);
  const cutKey = useRef<string | null>(null);
  const scanCallback = useRef<((result: ShearsScanResult) => void) | null>(
    null,
  );
  const cutCallback = useRef<((result: ShearsCutResult) => void) | null>(null);
  const [objRef, ready] = useBridgeHandle("shears", {
    onEvent: (event, args) => {
      if (event === "scan") {
        const result = args[0] as ShearsScanResult;
        if (result.key === scanKey.current) scanCallback.current?.(result);
      } else if (event === "cut") {
        const result = args[0] as ShearsCutResult;
        if (result.key === cutKey.current) cutCallback.current?.(result);
      }
    },
  });

  return useMemo(
    () => ({
      ready,
      scan: (key, callback) => {
        scanKey.current = key;
        scanCallback.current = callback;
        objRef.current?.scan(key);
      },
      cut: (key, kind, level, callback) => {
        cutKey.current = key;
        cutCallback.current = callback;
        objRef.current?.cut(key, kind, level);
      },
    }),
    [ready, objRef],
  );
}

type UninstallEvents = {
  onDone?: (ok: boolean, message: string) => void;
  onItemDone?: (item: string, ok: boolean, message: string) => void;
};

type Uninstall = {
  ready: boolean;
  preview: (
    key: string,
    hm: boolean,
    callback: (targets: UninstallTargets) => void,
  ) => void;
  run: (key: string, hm: boolean) => void;
  runItem: (key: string, hm: boolean, item: string) => void;
};

export function useUninstall(events?: UninstallEvents): Uninstall {
  const [objRef, ready] = useBridgeHandle("uninstall", {
    onEvent: (event, args) => {
      if (event === "done") {
        events?.onDone?.(args[0] as boolean, args[1] as string);
      } else if (event === "item_done") {
        events?.onItemDone?.(
          args[0] as string,
          args[1] as boolean,
          args[2] as string,
        );
      }
    },
  });

  return useMemo(
    () => ({
      ready,
      preview: (key, hm, callback) =>
        objRef.current?.preview(key, hm, callback),
      run: (key, hm) => objRef.current?.run(key, hm),
      runItem: (key, hm, item) => objRef.current?.run_item(key, hm, item),
    }),
    [ready, objRef],
  );
}

type Update = UpdateSnapshot & {
  check: (force?: boolean) => void;
  apply: (index: number) => void;
};

const UPDATE_DEFAULT: UpdateSnapshot = {
  busy: false,
  checking: false,
  components: [],
  checkError: "",
  progress: 0,
  applying: -1,
};

export function useUpdate(): Update {
  const [snap, setSnap] = useState<UpdateSnapshot>(UPDATE_DEFAULT);
  const [objRef] = useBridgeHandle("update", {
    init: (obj, alive) => {
      obj.snapshot((snapshot) => {
        if (alive()) setSnap(snapshot);
      });
      obj.check(false);
    },
    onEvent: (event, args, alive) => {
      if (event === "progress") {
        setSnap((prev) => ({ ...prev, progress: args[0] as number }));
      } else if (event !== "error") {
        objRef.current?.snapshot((snapshot) => {
          if (alive()) setSnap(snapshot);
        });
      }
    },
  });

  return useMemo(
    () => ({
      ...snap,
      check: (force = false) => objRef.current?.check(force),
      apply: (index) => objRef.current?.apply(index),
    }),
    [snap, objRef],
  );
}

const RVPN_DEFAULT: RvpnSnapshot = {
  status: "idle",
  installed: false,
  hasInstaller: false,
  busy: false,
  progress: 0,
  version: "",
};

type Rvpn = RvpnSnapshot & {
  ready: boolean;
  selectInstaller: () => void;
  start: () => void;
  stop: () => void;
  uninstall: () => void;
};

export function useRvpn(): Rvpn {
  const [snap, setSnap] = useState<RvpnSnapshot>(RVPN_DEFAULT);
  const [hydrated, setHydrated] = useState(false);
  const gotEvent = useRef(false);
  const [objRef, ready] = useBridgeHandle("rvpn", {
    init: (obj, alive) =>
      obj?.snapshot((snapshot) => {
        if (!alive()) return;
        if (!gotEvent.current) setSnap(snapshot);
        setHydrated(true);
      }),
    onEvent: (event, args) => {
      switch (event) {
        case "state":
          gotEvent.current = true;
          setSnap(args[0] as RvpnSnapshot);
          break;
        case "progress":
          setSnap((prev) => ({ ...prev, progress: args[0] as number }));
          break;
      }
    },
  });

  return useMemo(
    () => ({
      ...snap,
      ready: ready && hydrated,
      selectInstaller: () => objRef.current?.select_installer(),
      start: () => objRef.current?.start(),
      stop: () => objRef.current?.stop(),
      uninstall: () => objRef.current?.uninstall(),
    }),
    [snap, ready, hydrated, objRef],
  );
}

type CheatEngineEvents = { onDone?: (ok: boolean, message: string) => void };

type CheatEngine = {
  ready: boolean;
  pickInstaller: (callback: (path: string) => void) => void;
  seasons: (callback: (seasons: CheatEngineSeason[]) => void) => void;
  install: (key: string) => void;
  register: (
    key: string,
    callback: (result: CheatEngineResult) => void,
  ) => void;
  remove: (key: string, callback: (result: CheatEngineResult) => void) => void;
};

export function useCheatEngine(events?: CheatEngineEvents): CheatEngine {
  const [objRef, ready] = useBridgeHandle("cheatengine", {
    onEvent: (event, args) => {
      if (event === "done")
        events?.onDone?.(args[0] as boolean, args[1] as string);
    },
  });

  return useMemo(
    () => ({
      ready,
      pickInstaller: (callback) => objRef.current?.pick_installer(callback),
      seasons: (callback) => objRef.current?.seasons(callback),
      install: (key) => objRef.current?.install(key),
      register: (key, callback) => objRef.current?.register(key, callback),
      remove: (key, callback) => objRef.current?.remove(key, callback),
    }),
    [ready, objRef],
  );
}
