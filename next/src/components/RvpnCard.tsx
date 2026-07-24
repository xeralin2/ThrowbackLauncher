"use client";

import { useEffect, useRef, useState } from "react";
import { Button, iconButtonDanger } from "@/components/Button";
import { ExternalLink } from "@/components/ExternalLink";
import { Note } from "@/components/Note";
import { Row } from "@/components/SettingsControls";
import { Switch } from "@/components/Switch";
import { TrashIcon } from "@/components/TrashIcon";
import { VersionChip } from "@/components/VersionChip";
import { useRvpn, useSettings } from "@/lib/bridge";
import { openOnKey } from "@/lib/open-on-key";
import { showToast } from "@/lib/toast";

export function RvpnCard() {
  const [removing, setRemoving] = useState(false);
  const rvpn = useRvpn();
  const settings = useSettings();

  const running = rvpn.status === "running";
  const building = rvpn.status === "building";
  const active = running || building;

  const wasBusy = useRef(false);
  useEffect(() => {
    if (removing && wasBusy.current && !rvpn.busy) {
      setRemoving(false);
      if (!rvpn.installed) showToast("success", "Radmin VPN removed");
    }
    wasBusy.current = rvpn.busy;
  }, [rvpn.busy, rvpn.installed, removing]);

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-surface px-5 py-[0.85rem]">
      {!rvpn.ready ? (
        <Row label="Radmin VPN">
          <span className="font-mono text-ui text-text-muted">…</span>
        </Row>
      ) : rvpn.installed || active || rvpn.hasInstaller ? (
        <>
          <Row label="Radmin VPN">
            {running ? (
              <Button variant="secondary" onClick={() => rvpn.stop()}>
                Stop
              </Button>
            ) : building ? (
              <Button variant="secondary" onClick={() => rvpn.stop()}>
                Cancel
              </Button>
            ) : (
              <Button
                variant="primary"
                disabled={rvpn.busy}
                onClick={() => rvpn.start()}
              >
                Start
              </Button>
            )}
          </Row>
          {rvpn.installed && (
            <>
              <Row
                label="Autostart"
                hint="Start Radmin VPN automatically when you open the Launcher."
              >
                <Switch
                  label="Autostart"
                  checked={settings?.rvpn_autostart ?? false}
                  onChange={(value) => settings?.set_rvpn_autostart(value)}
                />
              </Row>
              <Row label="Installer">
                <span className="flex items-center gap-3">
                  {rvpn.version && <VersionChip version={rvpn.version} />}
                  <button
                    type="button"
                    aria-label="Uninstall Radmin VPN"
                    disabled={rvpn.busy || active}
                    onClick={() => {
                      setRemoving(true);
                      rvpn.uninstall();
                    }}
                    className={iconButtonDanger}
                  >
                    <TrashIcon />
                  </button>
                </span>
              </Row>
            </>
          )}
        </>
      ) : (
        <Row label="Radmin VPN">
          <Note>
            <ExternalLink href="https://radmin-vpn.com/">Download</ExternalLink>{" "}
            the Windows installer and{" "}
            <span
              role="button"
              tabIndex={0}
              onClick={() => rvpn.selectInstaller()}
              onKeyDown={openOnKey(() => rvpn.selectInstaller())}
              className="cursor-pointer text-notice-link underline hover:text-notice-link-hover"
            >
              select it
            </span>
            {"."}
          </Note>
        </Row>
      )}
      {building && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left bg-purple transition-transform duration-200"
          style={{ transform: `scaleX(${rvpn.progress / 100})` }}
        />
      )}
    </div>
  );
}
