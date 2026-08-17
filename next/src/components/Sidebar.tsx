"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CardCover } from "@/components/SeasonCover";
import { isActivePath, navSections, normalizePath } from "@/config/nav";
import { site } from "@/config/site";
import { fetchMemberCount } from "@/lib/discord";
import {
  determinatePercent,
  seasonTitle,
  useDownloader,
  useDownloadProgress,
  useHasLocalSeasons,
  useLaunch,
  useSeasons,
  useUpdate,
  type Season,
} from "@/lib/bridge";
import { useDetail } from "@/lib/detail";
import { openOnKey } from "@/lib/open-on-key";

function ActionIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function PauseIcon() {
  return <ActionIcon>{<path d="M9.5 6v12M14.5 6v12" />}</ActionIcon>;
}

function PlayIcon() {
  return <ActionIcon>{<path d="M8.5 5.7 18.5 12l-10 6.3Z" />}</ActionIcon>;
}

function CancelIcon() {
  return (
    <ActionIcon>{<path d="M7.5 7.5 16.5 16.5M16.5 7.5 7.5 16.5" />}</ActionIcon>
  );
}

function ActivityCard({
  season,
  tone,
  action,
  progress,
  onOpen,
}: {
  season: Season;
  tone?: "amber" | "purple" | "steel";
  action?: { label: string; icon: ReactNode; onClick: () => void };
  progress?: number;
  onOpen: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      data-tone={tone}
      onClick={onOpen}
      onKeyDown={openOnKey(onOpen)}
      className="card-glow-hover relative m-2 h-12 w-[calc(100%-1rem)] cursor-pointer overflow-hidden rounded-md border border-border text-left transition-[border-color,box-shadow] duration-200 [--card-glow-blur:16px]"
    >
      <CardCover season={season} sizes="280px" />
      {action && (
        <button
          type="button"
          aria-label={action.label}
          onClick={(event) => {
            event.stopPropagation();
            action.onClick();
          }}
          className="absolute inset-y-0 right-0 flex w-9 cursor-pointer items-center justify-center text-text"
        >
          {action.icon}
        </button>
      )}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2 ${
          action ? "pr-11" : "pr-2"
        }`}
      >
        <span className="min-w-0 grow truncate-fade font-display text-[0.8rem] font-bold leading-none text-text">
          {seasonTitle(season)}
        </span>
      </div>
      {progress !== undefined && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left rounded-[1px] bg-[var(--card-accent-line,var(--color-purple))] transition-transform duration-200"
          style={{ transform: `scaleX(${progress / 100})` }}
        />
      )}
    </div>
  );
}

function DownloadCard({
  season,
  onOpen,
  onToggle,
  paused,
  verifying,
}: {
  season: Season;
  onOpen: () => void;
  onToggle?: () => void;
  paused?: boolean;
  verifying?: boolean;
}) {
  const { progress, step, steps } = useDownloadProgress();
  const determinate = determinatePercent(progress, step, steps) !== null;
  return (
    <ActivityCard
      season={season}
      tone={paused ? "steel" : "purple"}
      progress={determinate ? progress : undefined}
      onOpen={onOpen}
      action={
        onToggle && {
          label: paused ? "Continue" : verifying ? "Cancel" : "Pause",
          icon: paused ? (
            <PlayIcon />
          ) : verifying ? (
            <CancelIcon />
          ) : (
            <PauseIcon />
          ),
          onClick: onToggle,
        }
      }
    />
  );
}

function RunningCard({
  season,
  launching,
  onOpen,
  onStop,
}: {
  season: Season;
  launching?: boolean;
  onOpen: () => void;
  onStop: () => void;
}) {
  return (
    <ActivityCard
      season={season}
      onOpen={onOpen}
      action={
        launching
          ? undefined
          : { label: "Stop", icon: <CancelIcon />, onClick: onStop }
      }
    />
  );
}

export function Sidebar({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate?: () => void;
}) {
  const pathname = normalizePath(usePathname());
  const router = useRouter();
  const [hoveredLink, setHoveredLink] = useState("");
  const linkRef = useRef<HTMLDivElement>(null);
  const [members, setMembers] = useState<string | null>(null);
  const [membersShown, setMembersShown] = useState(false);
  const membersRequested = useRef(false);

  function showMembers() {
    setMembersShown(true);
    if (membersRequested.current) return;
    membersRequested.current = true;
    fetchMemberCount(site.discordInvite).then((count) => {
      if (count != null) setMembers(count.toLocaleString("en-DK"));
    });
  }

  useEffect(() => {
    function onOver(event: MouseEvent) {
      const target = event.target;
      const anchor =
        target instanceof Element ? target.closest("a[href]") : null;
      const href = anchor?.getAttribute("href") ?? "";
      setHoveredLink(
        /^https?:\/\//.test(href) && !href.startsWith(window.location.origin)
          ? href
          : "",
      );
    }
    document.addEventListener("mouseover", onOver);
    return () => document.removeEventListener("mouseover", onOver);
  }, []);

  useEffect(() => {
    const el = linkRef.current;
    if (el)
      el.classList.toggle("truncate-fade", el.scrollWidth > el.clientWidth);
  }, [hoveredLink]);
  const update = useUpdate();
  const hasLocal = useHasLocalSeasons();
  const [dragId, setDragId] = useState<string | null>(null);
  const { detail } = useDetail();
  const dl = useDownloader();
  const seasons = useSeasons();
  const findEdition = (key: string, hm: boolean) => {
    const season = seasons?.find((entry) => entry.key === key);
    return season ? { ...season, hm } : undefined;
  };
  const editionId = (season: Season) => `${season.key}:${season.hm}`;
  const queuedSeasons = dl.queue.flatMap((entry) => {
    const season = findEdition(entry.key, entry.hm);
    return season ? [season] : [];
  });
  if (
    dragId !== null &&
    !queuedSeasons.some((season) => editionId(season) === dragId)
  )
    setDragId(null);
  const activeSeason =
    dl.running || dl.state === "paused"
      ? findEdition(dl.activeKey, dl.activeHm)
      : undefined;
  const lc = useLaunch();
  const liveRefs = lc.running.map((ref) => ({ ...ref, launching: false }));
  if (
    lc.launching &&
    !lc.running.some(
      (ref) => ref.key === lc.launching?.key && ref.hm === lc.launching?.hm,
    )
  )
    liveRefs.push({ ...lc.launching, launching: true });
  const liveSeasons = liveRefs.flatMap((ref) => {
    const season = findEdition(ref.key, ref.hm);
    return season ? [{ season, launching: ref.launching }] : [];
  });

  function openSeason(season: Season) {
    onNavigate?.();
    const ref = { key: season.key, hm: season.hm };
    if (detail?.seasonKey === season.key || pathname === "/download") {
      window.dispatchEvent(
        new CustomEvent("throwback:open-season", { detail: ref }),
      );
    } else {
      window.sessionStorage.setItem("tb-open-season", JSON.stringify(ref));
      router.push("/download");
    }
  }

  return (
    <aside
      id="sidebar"
      className={`fixed inset-y-0 left-0 z-(--z-sidebar) flex w-[var(--sidebar-w)] flex-col overflow-y-auto border-r border-border bg-surface max-nav:transition-transform max-nav:duration-320 max-nav:ease-[cubic-bezier(0.33,1,0.68,1)] ${
        open ? "max-nav:translate-x-0" : "max-nav:-translate-x-full"
      }`}
    >
      <div className="border-b border-border px-5 pb-4 pt-6 max-nav:pt-14">
        <div
          onMouseEnter={showMembers}
          onMouseLeave={() => setMembersShown(false)}
          className="mb-[0.3rem] w-fit font-mono text-micro uppercase tracking-[0.2em] text-action"
        >
          {membersShown && members
            ? `// ${members} MEMBERS`
            : "// R6S COMMUNITY"}
          <span className="ml-px inline-block animate-blink">_</span>
        </div>
        <div className="font-display text-[1.2rem] font-bold leading-[1.2] text-text">
          <span className="text-action">Throwback</span> Launcher
        </div>
      </div>

      <nav>
        {navSections.map((section) => {
          const sectionActive = section.items.some((item) =>
            isActivePath(item.href, pathname),
          );
          return (
            <div key={section.label} className="px-3 pb-2 pt-[1.2rem]">
              <div
                className={`mb-[0.4rem] px-2 font-mono text-micro uppercase tracking-[0.2em] ${
                  sectionActive ? "text-action" : "text-text-muted"
                }`}
              >
                {section.label}
              </div>
              {section.items.map((item) => {
                const active = isActivePath(item.href, pathname);
                const hidden =
                  item.href === "/" && !(hasLocal ?? pathname === "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(event) => {
                      onNavigate?.();
                      if (active && detail) {
                        event.preventDefault();
                        detail.reset();
                      }
                    }}
                    aria-current={active ? "page" : undefined}
                    aria-hidden={hidden || undefined}
                    tabIndex={hidden ? -1 : undefined}
                    className={`nav-link flex items-center justify-between overflow-hidden rounded-md px-3 text-[0.9rem] font-medium no-underline transition-[background-color,color,translate,max-height,opacity,padding] duration-200 ${
                      hidden
                        ? "pointer-events-none max-h-0 py-0 opacity-0"
                        : "max-h-10 py-[0.55rem] opacity-100"
                    } ${
                      active
                        ? "border-l-2 border-action bg-action-dim text-text shadow-[inset_0_0_14px_var(--color-action-glow-soft)]"
                        : "text-text-muted hover:bg-surface-2 hover:text-text"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.href === "/updates" &&
                      update.components.length > 0 && (
                        <span className="font-display text-[0.8rem] font-bold leading-none text-text">
                          {update.components.length}
                        </span>
                      )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto">
        {queuedSeasons.length > 0 && (
          <div className="mx-2 mb-2 flex max-h-36 flex-col-reverse overflow-y-auto rounded-md border border-border bg-surface-2">
            {queuedSeasons.map((season, index) => (
              <button
                key={editionId(season)}
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  setDragId(editionId(season));
                }}
                onDragEnd={() => setDragId(null)}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!dragId || dragId === editionId(season)) return;
                  const dragged = queuedSeasons.find(
                    (entry) => editionId(entry) === dragId,
                  );
                  if (!dragged) return;
                  const from = dl.queue.findIndex(
                    (entry) =>
                      entry.key === dragged.key && entry.hm === dragged.hm,
                  );
                  const to = dl.queue.findIndex(
                    (entry) =>
                      entry.key === season.key && entry.hm === season.hm,
                  );
                  if (from < 0 || to < 0) return;
                  const refs = dl.queue.map((entry) => ({
                    key: entry.key,
                    hm: entry.hm,
                  }));
                  const [moved] = refs.splice(from, 1);
                  refs.splice(to, 0, moved);
                  dl.reorderQueue(refs);
                }}
                onClick={() => openSeason(season)}
                className={`group flex w-full cursor-default items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-border ${
                  dragId === editionId(season) ? "opacity-40" : ""
                }`}
              >
                <span className="font-mono text-micro text-text-muted">
                  {index + 1}
                </span>
                <span className="min-w-0 grow truncate-fade font-display text-label font-bold leading-none text-text-muted transition-colors group-hover:text-text">
                  {seasonTitle(season)}
                </span>
              </button>
            ))}
          </div>
        )}
        {activeSeason && (
          <DownloadCard
            season={activeSeason}
            onOpen={() => openSeason(activeSeason)}
            paused={dl.state === "paused"}
            verifying={dl.verifying}
            onToggle={
              dl.verifying && dl.state === "downloading"
                ? () => dl.cancel()
                : dl.state === "downloading" || dl.state === "paused"
                  ? () => dl.setPaused(dl.state !== "paused")
                  : undefined
            }
          />
        )}
        {liveSeasons.map(({ season, launching }) => (
          <RunningCard
            key={editionId(season)}
            season={season}
            launching={launching}
            onOpen={() => openSeason(season)}
            onStop={() => lc.stop(season.key)}
          />
        ))}
      </div>

      {hoveredLink && (
        <div
          ref={linkRef}
          className="pointer-events-none fixed bottom-2 left-2 z-(--z-sidebar-edge) max-w-[calc(100vw_-_1rem)] overflow-hidden whitespace-nowrap rounded-md border border-border bg-surface-2 p-[0.2rem] font-mono text-[0.7rem] text-text max-nav:hidden"
        >
          {hoveredLink}
        </div>
      )}
    </aside>
  );
}
