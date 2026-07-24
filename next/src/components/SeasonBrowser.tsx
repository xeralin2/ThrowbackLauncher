"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal, flushSync } from "react-dom";
import { usePathname } from "next/navigation";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { SeasonDetail } from "@/components/SeasonDetail";
import { CardCover, SeasonCover } from "@/components/SeasonCover";
import {
  seasonTitle,
  useDownloader,
  useLaunch,
  useSettings,
  type Season,
} from "@/lib/bridge";
import { useDetail } from "@/lib/detail";
import { openOnKey } from "@/lib/open-on-key";
import { seasonRank } from "@/lib/seasons";
import { useTopbarSlot } from "@/lib/topbar-slot";
import { withViewTransition } from "@/lib/view-transition";

const BannerCard = memo(function BannerCard({
  season,
  onOpen,
}: {
  season: Season;
  onOpen: (season: Season) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(season)}
      className="group relative block h-[210px] w-full overflow-hidden rounded-none text-left"
    >
      <SeasonCover
        cover={season.cover}
        sizes="100vw"
        imgClassName="transition-transform duration-200 ease-out group-hover:scale-[1.06]"
      />

      <div className="absolute inset-0 bg-black/40 transition-colors duration-200 group-hover:bg-black/20" />

      <div className="absolute left-10 top-1/2 -translate-y-1/2 font-display text-[1.9rem] font-bold leading-none text-text">
        {season.code}
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-28">
        <span className="font-display text-[2.4rem] font-bold leading-none text-text [text-shadow:0_2px_10px_rgba(0,0,0,0.7)]">
          {season.name}
        </span>
      </div>
    </button>
  );
});

const GRID_GAP = 16;
const ROW_SPAN_MAX = 7;
const DEFAULT_SIZE = "1x2";
const ROW_SPANS = [
  "",
  "",
  "row-span-2",
  "row-span-3",
  "row-span-4",
  "row-span-5",
  "row-span-6",
  "row-span-7",
];
const COL_SPANS = [
  "",
  "",
  "col-span-2 max-[40em]:col-span-1",
  "col-span-2 max-[40em]:col-span-1 min-[80em]:col-span-3",
  "col-span-2 max-[40em]:col-span-1 min-[80em]:col-span-3 min-[100em]:col-span-4",
];
const COVER_MAX_ASPECT = 5.5;

function cardSizes(spanW: number, spanH: number): string {
  const height = `${((COVER_MAX_ASPECT * 100 * spanH) / 7).toFixed(2)}dvh - ${
    COVER_MAX_ASPECT * (12 * spanH + GRID_GAP)
  }px`;
  const width = (cols: number) => {
    const span = Math.min(spanW, cols);
    const track = `(100vw - clamp(200px, 18vw, 280px) - ${48 + GRID_GAP * cols}px)`;
    if (span === cols) return `${track} + ${GRID_GAP * (span - 1)}px`;
    if (span === 1) return `${track}/${cols}`;
    return `${track}*${span}/${cols} + ${GRID_GAP * (span - 1)}px`;
  };
  return `(min-width: 100em) max(${width(4)}, ${height}), (min-width: 80em) max(${width(3)}, ${height}), max(${width(2)}, ${height})`;
}

type CardAction = {
  kind:
    "pause" | "dequeue" | "continue" | "cancel" | "play" | "stop" | "launching";
  label: string;
  primary: boolean;
  pulse?: boolean;
};

type TransferState =
  "downloading" | "preparing" | "applying" | "failed" | "queued" | null;

const DashCard = memo(function DashCard({
  season,
  actionLabel,
  actionPrimary,
  actionPulse = false,
  status,
  editing = false,
  dragging = false,
  wigglePhase = 0,
  spanW,
  spanH,
  onRegister,
  onOpen,
  onAction,
  onDragStart,
  onDragOver,
  onDragEnd,
  onResizePreview,
  onResizeCommit,
}: {
  season: Season;
  actionLabel: string | null;
  actionPrimary: boolean;
  actionPulse?: boolean;
  status?: "amber" | "purple" | "steel";
  editing?: boolean;
  dragging?: boolean;
  wigglePhase?: number;
  spanW: number;
  spanH: number;
  onRegister?: (key: string, el: HTMLDivElement | null) => void;
  onOpen: (season: Season) => void;
  onAction: (season: Season) => void;
  onDragStart?: (key: string) => void;
  onDragOver?: (key: string) => void;
  onDragEnd?: (cancelled: boolean) => void;
  onResizePreview?: (key: string, width: number, height: number) => void;
  onResizeCommit?: (key: string, width: number, height: number) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  function startResize(event: React.PointerEvent) {
    const root = rootRef.current;
    const grid = root?.parentElement;
    if (!root || !grid || event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    const pointerId = event.pointerId;
    const columns =
      getComputedStyle(grid).gridTemplateColumns.split(" ").length;
    const unitW =
      (grid.clientWidth - (columns - 1) * GRID_GAP) / columns + GRID_GAP;
    const maxW = Math.min(COL_SPANS.length - 1, columns);
    const startRect = root.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startW = spanW;
    const startH = spanH;
    const renderedW = Math.round((startRect.width + GRID_GAP) / unitW);
    const rowUnit = (startRect.height + GRID_GAP) / startH;
    let lastW = spanW;
    let lastH = spanH;

    function detach() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    }

    function onMove(move: PointerEvent) {
      if (move.pointerId !== pointerId) return;
      const column = Math.max(
        1,
        Math.min(
          maxW,
          Math.round(
            (startRect.width + move.clientX - startX + GRID_GAP) / unitW,
          ),
        ),
      );
      const width = column === renderedW ? startW : column;
      const height = Math.max(
        1,
        Math.min(
          ROW_SPAN_MAX,
          Math.round(
            (startRect.height + move.clientY - startY + GRID_GAP) / rowUnit,
          ),
        ),
      );
      if (width !== lastW || height !== lastH) {
        lastW = width;
        lastH = height;
        onResizePreview?.(season.id, width, height);
      }
    }

    function onUp(up: PointerEvent) {
      if (up.pointerId !== pointerId) return;
      detach();
      onResizeCommit?.(season.id, lastW, lastH);
    }

    function onCancel(cancel: PointerEvent) {
      if (cancel.pointerId !== pointerId) return;
      detach();
      onResizePreview?.(season.id, startW, startH);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  }

  return (
    <div
      ref={(el) => {
        rootRef.current = el;
        onRegister?.(season.id, el);
      }}
      data-status={status}
      style={{
        viewTransitionName: `card-${season.id}`,
        ...(editing && !dragging
          ? { animationDelay: `-${wigglePhase * 90}ms` }
          : {}),
      }}
      role={editing ? undefined : "button"}
      tabIndex={editing ? -1 : 0}
      draggable={editing}
      onClick={editing ? undefined : () => onOpen(season)}
      onKeyDown={editing ? undefined : openOnKey(() => onOpen(season))}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/x-throwback-season", season.id);
        onDragStart?.(season.id);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver?.(season.id);
      }}
      onDrop={(event) => event.preventDefault()}
      onDragEnd={(event) =>
        onDragEnd?.(event.dataTransfer.dropEffect === "none")
      }
      className={`group relative h-full rounded-lg border border-border bg-surface transition-[border-color,box-shadow,opacity] duration-200 ${
        editing
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-pointer overflow-hidden card-glow-hover card-line-hover"
      } ${editing && !dragging ? "animate-wiggle" : ""} ${
        dragging ? "opacity-40" : ""
      } ${COL_SPANS[spanW] ?? ""} ${ROW_SPANS[spanH] ?? ""}`}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[7px] will-change-transform">
        <CardCover season={season} sizes={cardSizes(spanW, spanH)} />
      </div>
      {editing && (
        <span
          role="presentation"
          draggable={false}
          onDragStart={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onPointerDown={startResize}
          className="absolute -bottom-[3px] -right-[3px] z-10 h-4 w-4 touch-none cursor-nwse-resize text-text/90"
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
            <path
              d="M 2.5 13.5 L 6 13.5 A 7.5 7.5 0 0 0 13.5 6 L 13.5 2.5"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}
      <div
        className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 py-2 pl-3 pr-2 ${
          editing ? "pointer-events-none" : ""
        }`}
      >
        <div className="min-w-0 grow truncate-fade font-display text-[1.05rem] font-bold leading-tight text-text">
          {seasonTitle(season)}
        </div>
        {actionLabel && (
          <Button
            variant={actionPrimary ? "primary" : "secondary"}
            disabled={actionPulse}
            className={actionPulse ? "animate-pulse disabled:opacity-100" : ""}
            onClick={(event) => {
              event.stopPropagation();
              onAction(season);
            }}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
});

export function SeasonBrowser({
  seasons,
  emptyMessage,
  layout = "banner",
  onReturn,
  searchable = false,
}: {
  seasons: Season[] | null;
  emptyMessage: ReactNode;
  layout?: "banner" | "dashboard";
  onReturn?: () => void;
  searchable?: boolean;
}) {
  const [selected, setSelected] = useState<{
    season: Season;
    hm: boolean;
    depth: number;
  } | null>(null);
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const topbarSlot = useTopbarSlot();
  const [direction, setDirection] = useState<"none" | "forward" | "back">(
    "none",
  );
  const [returnScroll, setReturnScroll] = useState(0);
  const [editing, setEditing] = useState(false);
  const [resetErase, setResetErase] = useState(0);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [draftOrder, setDraftOrder] = useState<string[] | null>(null);
  const [draftSizes, setDraftSizes] = useState<Record<string, string>>({});
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const lastRects = useRef(new Map<string, { left: number; top: number }>());
  const flipping = useRef(false);
  const dl = useDownloader();
  const lc = useLaunch();
  const settings = useSettings();

  const [restoredFrom, setRestoredFrom] = useState<Season[] | null>(null);
  if (seasons?.length && seasons !== restoredFrom) {
    setRestoredFrom(seasons);
    const entry = window.history.state as {
      tbSeason?: string;
      tbHm?: boolean;
      tbDepth?: number;
      tbPath?: string;
    } | null;
    if (!selected && entry?.tbSeason && entry.tbPath === pathname) {
      const restored =
        seasons.find(
          (s) => s.key === entry.tbSeason && s.hm === !!entry.tbHm,
        ) ?? seasons.find((s) => s.key === entry.tbSeason);
      if (restored)
        setSelected({
          season: restored,
          hm: !!entry.tbHm,
          depth: entry.tbDepth ?? 0,
        });
    }
  }

  const open = useCallback(
    (season: Season, hm: boolean = season.hm) => {
      const state = window.history.state as {
        tbSeason?: string;
        tbDepth?: number;
      } | null;
      if (!state?.tbSeason) setReturnScroll(window.scrollY);
      const depth = (state?.tbDepth ?? 0) + 1;
      setDirection("forward");
      window.history.pushState(
        {
          tbSeason: season.key,
          tbHm: hm,
          tbDepth: depth,
          tbPath: pathname,
        },
        "",
      );
      setSelected({ season, hm, depth });
    },
    [pathname],
  );

  const setVariant = useCallback((hm: boolean) => {
    const state = window.history.state as {
      tbSeason?: string;
      tbHm?: boolean;
      tbDepth?: number;
    } | null;
    if (state?.tbSeason)
      window.history.replaceState({ ...state, tbHm: hm }, "");
    setSelected((prev) => (prev ? { ...prev, hm } : prev));
  }, []);

  const resetToList = useCallback(() => {
    const depth =
      (window.history.state as { tbDepth?: number } | null)?.tbDepth ?? 0;
    if (depth > 0) window.history.go(-depth);
  }, []);

  const closeDetail = useCallback(() => {
    flushSync(() => {
      setDirection("back");
      setSelected(null);
    });
    window.scrollTo(0, returnScroll);
    onReturn?.();
  }, [returnScroll, onReturn]);

  const back = useCallback(() => {
    window.history.back();
  }, []);

  const { setDetail } = useDetail();
  useEffect(() => {
    setDetail(
      selected
        ? {
            label: `${selected.season.code} ${selected.hm ? "Heated Metal" : selected.season.name}`,
            seasonKey: selected.season.key,
            reset: resetToList,
          }
        : null,
    );
    return () => setDetail(null);
  }, [selected, setDetail, resetToList]);

  useLayoutEffect(() => {
    if (!editing) {
      if (lastRects.current.size) lastRects.current = new Map();
      return;
    }
    const previous = lastRects.current;
    const next = new Map<string, { left: number; top: number }>();
    let moved = false;
    cardRefs.current.forEach((el, key) => {
      const rect = el.getBoundingClientRect();
      const pos = {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY,
      };
      next.set(key, pos);
      const before = previous.get(key);
      if (!before) return;
      const dx = before.left - pos.left;
      const dy = before.top - pos.top;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        el.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
          { duration: 260, easing: "cubic-bezier(0.2, 0, 0, 1)" },
        );
        moved = true;
      }
    });
    lastRects.current = next;
    if (moved) {
      flipping.current = true;
      window.setTimeout(() => {
        flipping.current = false;
      }, 300);
    }
  });

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const state = event.state as {
        tbSeason?: string;
        tbHm?: boolean;
        tbDepth?: number;
      } | null;
      const poppedDepth = state?.tbDepth ?? 0;
      const list = seasons ?? [];
      const target = state?.tbSeason
        ? (list.find(
            (s) => s.key === state.tbSeason && s.hm === !!state.tbHm,
          ) ?? list.find((s) => s.key === state.tbSeason))
        : null;
      if (target) {
        setDirection(poppedDepth < (selected?.depth ?? 0) ? "back" : "forward");
        setSelected({ season: target, hm: !!state?.tbHm, depth: poppedDepth });
      } else if (selected) {
        closeDetail();
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [seasons, selected, closeDetail]);

  useEffect(() => {
    if (!selected) return;
    function onBack(event: Event) {
      event.preventDefault();
      back();
    }
    window.addEventListener("throwback:back", onBack);
    return () => window.removeEventListener("throwback:back", onBack);
  }, [selected, back]);

  useEffect(() => {
    if (!seasons) return;
    function openByRef(ref: { key: string; hm: boolean }) {
      const target = seasons?.find((season) => season.key === ref.key);
      if (!target) return;
      const hm = ref.hm && target.hmAvailable;
      if (selected?.season.key === target.key) {
        if (selected.hm !== hm) setVariant(hm);
        return;
      }
      open(target, hm);
    }
    const pending = window.sessionStorage.getItem("tb-open-season");
    if (pending) {
      const ref = JSON.parse(pending) as { key: string; hm: boolean };
      if (seasons.some((season) => season.key === ref.key)) {
        window.sessionStorage.removeItem("tb-open-season");
        openByRef(ref);
      }
    }
    function onOpen(event: Event) {
      openByRef((event as CustomEvent).detail as { key: string; hm: boolean });
    }
    window.addEventListener("throwback:open-season", onOpen);
    return () => window.removeEventListener("throwback:open-season", onOpen);
  }, [seasons, selected, open, setVariant]);

  const transferState = useCallback(
    (season: Season): TransferState => {
      const active = dl.activeKey === season.key && dl.activeHm === season.hm;
      if (dl.running && active)
        return dl.state === "preparing"
          ? "preparing"
          : dl.state === "applying"
            ? "applying"
            : "downloading";
      if (active && dl.state === "failed") return "failed";
      if (
        dl.queue.some(
          (entry) =>
            entry.key === season.key && entry.hm === season.hm && !entry.verify,
        )
      )
        return "queued";
      return null;
    },
    [dl],
  );

  const cardAction = useCallback(
    (season: Season): CardAction | null => {
      const active = dl.activeKey === season.key && dl.activeHm === season.hm;
      if (season.partial) {
        const transfer = transferState(season);
        if (transfer === "downloading") {
          return dl.state === "downloading"
            ? { kind: "pause", label: "Pause", primary: false }
            : null;
        }
        if (transfer === "preparing" || transfer === "applying") return null;
        if (transfer === "queued") {
          return {
            kind: "dequeue",
            label: "Remove from queue",
            primary: false,
          };
        }
        return { kind: "continue", label: "Continue", primary: false };
      }
      if (dl.running && active) {
        return dl.state === "downloading"
          ? { kind: "cancel", label: "Cancel", primary: false }
          : null;
      }
      if (
        lc.running.some((ref) => ref.key === season.key && ref.hm === season.hm)
      ) {
        return { kind: "stop", label: "Stop", primary: true };
      }
      if (lc.launching?.key === season.key && lc.launching.hm === season.hm) {
        return {
          kind: "launching",
          label: "Launching",
          primary: true,
          pulse: true,
        };
      }
      return { kind: "play", label: "Play", primary: true };
    },
    [dl, lc, transferState],
  );

  const statusKey = useCallback(
    (season: Season): "amber" | "purple" | "steel" | undefined => {
      const active = dl.activeKey === season.key && dl.activeHm === season.hm;
      if (dl.verifying && active) return "purple";
      if (!season.partial) return undefined;
      if (dl.running && active) return "purple";
      if (active && dl.state === "failed") return "amber";
      return "steel";
    },
    [dl],
  );

  const registerCard = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(key, el);
    else cardRefs.current.delete(key);
  }, []);

  const startDrag = useCallback((key: string) => setDragKey(key), []);

  const previewResize = useCallback(
    (key: string, width: number, height: number) =>
      setDraftSizes((prev) => ({ ...prev, [key]: `${width}x${height}` })),
    [],
  );

  const commitResize = useCallback(
    (key: string, width: number, height: number) =>
      settings?.set_home_size(key, width, height),
    [settings],
  );

  const animation =
    direction === "forward"
      ? "animate-slide-from-right"
      : direction === "back"
        ? "animate-slide-from-left"
        : "";

  const trimmed = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      seasons && trimmed
        ? seasons.filter((season) =>
            [season.label, season.hmAvailable ? "heated metal hm" : ""]
              .join(" ")
              .toLowerCase()
              .includes(trimmed),
          )
        : seasons,
    [seasons, trimmed],
  );

  const bySeason = useMemo(
    () => new Map((visible ?? []).map((season) => [season.id, season])),
    [visible],
  );

  const savedOrder = settings?.home_order;
  const defaultOrder = useMemo(
    () =>
      [...bySeason.values()]
        .sort((a, b) => seasonRank(a.key) - seasonRank(b.key))
        .map((season) => season.id),
    [bySeason],
  );
  const baseKeys = useMemo(() => {
    const saved = savedOrder ?? [];
    return [
      ...saved.filter((key) => bySeason.has(key)),
      ...defaultOrder.filter((key) => !saved.includes(key)),
    ];
  }, [bySeason, savedOrder, defaultOrder]);

  const effectiveOrder = useMemo(() => {
    if (!draftOrder || !draftOrder.every((key) => bySeason.has(key)))
      return baseKeys;
    const missing = baseKeys.filter((key) => !draftOrder.includes(key));
    return missing.length ? [...draftOrder, ...missing] : draftOrder;
  }, [draftOrder, bySeason, baseKeys]);

  const latest = useRef({
    dragKey,
    draftOrder,
    effectiveOrder,
    savedOrder,
    settings,
    cardAction,
    dl,
    lc,
  });
  useLayoutEffect(() => {
    latest.current = {
      dragKey,
      draftOrder,
      effectiveOrder,
      savedOrder,
      settings,
      cardAction,
      dl,
      lc,
    };
  });

  const runAction = useCallback((season: Season) => {
    const { cardAction, dl, lc } = latest.current;
    const action = cardAction(season);
    if (!action) return;
    switch (action.kind) {
      case "pause":
        dl.setPaused(true);
        break;
      case "dequeue":
        dl.dequeue(season.key, season.hm);
        break;
      case "continue":
        dl.enqueue(season.key, season.hm, "");
        break;
      case "cancel":
        dl.cancel();
        break;
      case "play":
        lc.launch(season.key, season.hm);
        break;
      case "stop":
        lc.stop(season.key);
        break;
      case "launching":
        break;
    }
  }, []);

  const moveDragged = useCallback((overKey: string) => {
    const { dragKey, effectiveOrder } = latest.current;
    if (!dragKey || dragKey === overKey || flipping.current) return;
    const from = effectiveOrder.indexOf(dragKey);
    const to = effectiveOrder.indexOf(overKey);
    if (from === -1 || to === -1 || from === to) return;
    const next = [...effectiveOrder];
    next.splice(from, 1);
    next.splice(to, 0, dragKey);
    setDraftOrder(next);
  }, []);

  const persistOrder = useCallback((order: string[]) => {
    const { savedOrder, settings } = latest.current;
    const saved = savedOrder ?? [];
    const displayed = new Set(order);
    const queue = [...order];
    const merged = saved.map((key) =>
      displayed.has(key) ? (queue.shift() as string) : key,
    );
    settings?.set_home_order([...merged, ...queue]);
  }, []);

  const endDrag = useCallback(
    (cancelled: boolean) => {
      const { draftOrder } = latest.current;
      if (cancelled) setDraftOrder(null);
      else if (draftOrder) persistOrder(draftOrder);
      setDragKey(null);
    },
    [persistOrder],
  );

  const applyLayout = useCallback(
    (apply: () => void) => {
      if (editing) apply();
      else withViewTransition(apply, "cards");
    },
    [editing],
  );

  const reverseOrder = useCallback(() => {
    const order = [...latest.current.effectiveOrder].reverse();
    persistOrder(order);
    applyLayout(() => setDraftOrder(order));
  }, [persistOrder, applyLayout]);

  const resetLayout = useCallback(() => {
    latest.current.settings?.reset_home_layout();
    setResetErase((value) => value + 1);
    applyLayout(() => {
      setDraftOrder(defaultOrder);
      setDraftSizes(
        Object.fromEntries(defaultOrder.map((key) => [key, DEFAULT_SIZE])),
      );
    });
  }, [applyLayout, defaultOrder]);

  let listContent: ReactNode;
  if (seasons === null || visible === null) {
    listContent = (
      <p className="font-mono text-ui text-text-muted">Loading seasons…</p>
    );
  } else if (seasons.length === 0) {
    listContent = (
      <Callout label="// NOTE" className="max-w-[640px]">
        {emptyMessage}
      </Callout>
    );
  } else if (visible.length === 0) {
    listContent = (
      <Callout label="// NOTE" className="max-w-[640px]">
        No seasons match <span className="font-semibold">{query.trim()}</span>.
      </Callout>
    );
  } else if (layout === "dashboard") {
    listContent = (
      <div
        className="home-grid grid grid-cols-2 max-[40em]:grid-cols-1 min-[80em]:grid-cols-3 min-[100em]:grid-cols-4"
        style={{ gap: GRID_GAP }}
        onDragOver={editing ? (event) => event.preventDefault() : undefined}
        onDrop={editing ? (event) => event.preventDefault() : undefined}
      >
        {effectiveOrder.flatMap((id, index) => {
          const season = bySeason.get(id);
          if (!season) return [];
          const action = cardAction(season);
          const [spanW, spanH] = (
            draftSizes[season.id] ??
            settings?.home_sizes[season.id] ??
            DEFAULT_SIZE
          )
            .split("x")
            .map(Number);
          return (
            <DashCard
              key={season.id}
              season={season}
              actionLabel={action ? action.label : null}
              actionPrimary={action !== null && action.primary}
              actionPulse={action?.pulse ?? false}
              status={statusKey(season)}
              editing={editing}
              dragging={dragKey === season.id}
              wigglePhase={index % 4}
              spanW={spanW}
              spanH={spanH}
              onResizePreview={previewResize}
              onResizeCommit={commitResize}
              onRegister={registerCard}
              onOpen={open}
              onAction={runAction}
              onDragStart={startDrag}
              onDragOver={moveDragged}
              onDragEnd={endDrag}
            />
          );
        })}
      </div>
    );
  } else {
    listContent = (
      <div className="-mx-6 -mb-6 -mt-6 flex flex-col max-[48em]:-mx-5 max-[48em]:-mb-5 max-[48em]:-mt-5 min-[100em]:-mx-10 min-[100em]:-mb-10 min-[100em]:-mt-10">
        {visible.map((season) => (
          <BannerCard key={season.id} season={season} onOpen={open} />
        ))}
      </div>
    );
  }

  return (
    <div key={selected ? selected.season.key : "list"} className={animation}>
      {selected ? (
        <SeasonDetail
          season={selected.season}
          hm={selected.hm}
          onHmChange={setVariant}
          onBack={back}
        />
      ) : (
        <>
          {searchable &&
            topbarSlot &&
            createPortal(
              <div className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-1 transition-colors focus-within:border-action">
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 flex-shrink-0 text-text-muted"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={query}
                  placeholder="Search"
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setQuery("");
                  }}
                  className="w-[110px] min-w-0 bg-transparent font-mono text-ui leading-5 text-text outline-none placeholder:text-text-muted"
                />
              </div>,
              topbarSlot,
            )}
          {layout === "dashboard" &&
            topbarSlot &&
            (seasons?.length ?? 0) > 0 &&
            createPortal(
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Reset layout"
                  onClick={resetLayout}
                  className="text-text-muted transition-colors hover:text-text"
                >
                  <svg
                    key={resetErase}
                    viewBox="0 0 24 24"
                    className={`h-[18px] w-[18px] ${resetErase ? "animate-erase-once" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                    <path d="M22 21H7" />
                    <path d="m5 11 9 9" />
                  </svg>
                </button>
                {(seasons?.length ?? 0) > 1 && (
                  <button
                    type="button"
                    aria-label="Reverse order"
                    onClick={reverseOrder}
                    className="text-text-muted transition-colors hover:text-text"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-[18px] w-[18px]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 20V4m0 0L4 7m3-3 3 3" />
                      <path d="M17 4v16m0 0 3-3m-3 3-3-3" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  aria-label={editing ? "Done arranging" : "Arrange seasons"}
                  onClick={() => {
                    setEditing((value) => !value);
                    setResetErase(0);
                    setDraftOrder(null);
                    setDraftSizes({});
                    setDragKey(null);
                  }}
                  className={`transition-colors ${
                    editing ? "text-action" : "text-text-muted hover:text-text"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-[18px] w-[18px]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M13 21h8" />
                    <path
                      fill={editing ? "currentColor" : "none"}
                      d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
                    />
                  </svg>
                </button>
              </div>,
              topbarSlot,
            )}
          {listContent}
        </>
      )}
    </div>
  );
}
