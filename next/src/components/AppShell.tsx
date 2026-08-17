"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DiskSpaceModal } from "./DiskSpaceModal";
import { Sidebar } from "./Sidebar";
import { SteamLoginModal } from "./SteamLoginModal";
import { Toasts } from "./Toasts";
import { Topbar } from "./Topbar";
import { ScrollReveal } from "./ScrollReveal";
import {
  applyAccent,
  DEFAULT_ACCENT,
  DEFAULT_FILL,
  DEFAULT_STRIPE,
} from "@/config/accents";
import { breadcrumbFor, normalizePath, resolveCrumbHref } from "@/config/nav";
import {
  onBridgeEvent,
  useHasLocalSeasons,
  useInfo,
  useSettings,
} from "@/lib/bridge";
import { DetailContext, type DetailCrumb } from "@/lib/detail";
import { resetPlatformView } from "@/lib/platform-view";
import { showToast, type ToastKind } from "@/lib/toast";

const ERROR_TARGETS: [string, string | undefined][] = [
  ["rvpn", undefined],
  ["launch", undefined],
  ["liberator", "liberator"],
];

function BridgeToasts() {
  const settings = useSettings();
  const info = useInfo();

  useEffect(() => {
    if (info?.warning) showToast("warning", info.warning);
  }, [info?.warning]);

  useEffect(() => {
    if (!settings) return;
    const onInvalid = (_field: string, message: string) =>
      showToast("error", message);
    const onLoggedOut = (kind: string, message: string) =>
      showToast(kind as ToastKind, message);
    const onCacheCleared = () => showToast("success", "Cache cleared");
    settings.settings_error.connect(onInvalid);
    settings.logged_out.connect(onLoggedOut);
    settings.cache_cleared.connect(onCacheCleared);
    return () => {
      settings.settings_error.disconnect(onInvalid);
      settings.logged_out.disconnect(onLoggedOut);
      settings.cache_cleared.disconnect(onCacheCleared);
    };
  }, [settings]);

  useEffect(
    () =>
      onBridgeEvent("downloader", (event, args) => {
        if (event === "error") {
          showToast("error", args[0] as string);
        } else if (event === "done") {
          const outcome = args[1] as string;
          const code = (args[0] as string).split("_")[0];
          if (outcome === "done") showToast("success", `${code} installed`);
          else if (outcome === "verified")
            showToast("success", `${code} verified`);
          else if (outcome === "switched_hm")
            showToast("success", `${code} switched to Heated Metal`);
          else if (outcome === "switched_tb")
            showToast("success", `${code} switched to Throwback`);
          else if (outcome === "no_space")
            showToast("error", "Ran out of disk space");
        } else if (event === "partial_deleted") {
          showToast(args[2] ? "success" : "error", args[3] as string);
        } else if (event === "rate_limited") {
          showToast("warning", args[0] as string, { key: "rate-limit" });
        } else if (event === "warning") {
          showToast("warning", args[0] as string);
        }
      }),
    [],
  );

  useEffect(() => {
    const offs = ERROR_TARGETS.map(([target, key]) =>
      onBridgeEvent(target, (event, args) => {
        if (event === "error") showToast("error", args[0] as string, { key });
      }),
    );
    return () => offs.forEach((off) => off());
  }, []);

  useEffect(
    () =>
      onBridgeEvent("update", (event, args) => {
        if (event === "done") {
          const name = args[1] as string;
          const message = args[2] as string;
          if (args[0]) showToast("success", `${name} updated`);
          else showToast("error", message || `${name} update failed`);
        } else if (event === "error") {
          showToast("error", args[0] as string);
        }
      }),
    [],
  );

  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<DetailCrumb | null>(null);
  const detailStore = useMemo(() => ({ detail, setDetail }), [detail]);
  const pathname = usePathname();
  const router = useRouter();
  const hasLocal = useHasLocalSeasons();
  const settings = useSettings();

  useEffect(() => {
    const accent = settings?.accent || DEFAULT_ACCENT;
    const root = document.documentElement;
    root.style.setProperty("--bar-fill", settings?.bar_fill || DEFAULT_FILL);
    root.style.setProperty(
      "--bar-stripe",
      settings?.bar_stripe || DEFAULT_STRIPE,
    );
    applyAccent(accent);
  }, [settings?.bar_fill, settings?.bar_stripe, settings?.accent]);

  useEffect(() => {
    document.documentElement.toggleAttribute(
      "data-reduce-motion",
      !!settings?.reduce_motion,
    );
  }, [settings?.reduce_motion]);

  useEffect(() => {
    if (!normalizePath(pathname).startsWith("/faq")) resetPlatformView();
  }, [pathname]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      )
        return;
      if (document.querySelector('[role="dialog"]')) return;
      const intercepted = new CustomEvent("throwback:back", {
        cancelable: true,
      });
      window.dispatchEvent(intercepted);
      if (intercepted.defaultPrevented) return;
      const current = normalizePath(pathname);
      const crumbs = breadcrumbFor(current);
      const parent = crumbs.length > 1 ? crumbs[crumbs.length - 2].href : null;
      if (!parent) return;
      const destination = resolveCrumbHref(parent, hasLocal);
      if (destination === current) return;
      router.push(destination);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname, router, hasLocal]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const sidebar = document.getElementById("sidebar");
      const hamburger = document.getElementById("hamburger");
      const target = event.target as Node;
      if (
        sidebar &&
        !sidebar.contains(target) &&
        hamburger &&
        !hamburger.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <DetailContext.Provider value={detailStore}>
      <button
        id="hamburger"
        type="button"
        aria-label="Toggle navigation menu"
        aria-expanded={open}
        aria-controls="sidebar"
        onClick={() => setOpen((value) => !value)}
        className="fixed left-3 top-3 z-(--z-hamburger) hidden flex-col gap-1 px-2 py-2.5 max-nav:flex"
      >
        <span
          className={`block h-0.5 w-[18px] rounded-sm bg-text transition-transform duration-200 ease-in-out ${
            open ? "translate-y-[3px] rotate-45" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-[18px] rounded-sm bg-text transition-transform duration-200 ease-in-out ${
            open ? "-translate-y-[3px] -rotate-45" : ""
          }`}
        />
      </button>

      <div className="flex min-h-screen">
        <Sidebar open={open} onNavigate={() => setOpen(false)} />
        <div className="ml-[var(--sidebar-w)] flex min-h-screen min-w-0 flex-1 flex-col overflow-y-clip max-nav:ml-0">
          <Topbar />
          <main
            key={pathname}
            className="w-full flex-1 animate-fade-up p-(--page-pad)"
          >
            {children}
          </main>
        </div>
      </div>

      <Toasts />
      <BridgeToasts />
      <SteamLoginModal />
      <DiskSpaceModal />
      <ScrollReveal />
    </DetailContext.Provider>
  );
}
