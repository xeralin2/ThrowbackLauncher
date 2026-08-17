"use client";

import { useEffect, useRef, useState } from "react";
import { Button, iconButton } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { ExternalLink } from "@/components/ExternalLink";
import { InfoHint } from "@/components/InfoHint";
import { Note } from "@/components/Note";
import { card, fieldRow, ListRow } from "@/components/ui";
import { Row } from "@/components/SettingsControls";
import { Switch } from "@/components/Switch";
import { RemoveIcon } from "@/components/RemoveIcon";
import { valueChip, VersionChip } from "@/components/VersionChip";
import { useRvpn, useSettings } from "@/lib/bridge";
import { openOnKey } from "@/lib/open-on-key";
import { showToast } from "@/lib/toast";

export function RvpnCard() {
  const [removing, setRemoving] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const rvpn = useRvpn();
  const settings = useSettings();

  const running = rvpn.state === "running";
  const building = rvpn.state === "building";
  const active = running || building;

  const wasBusy = useRef(false);
  useEffect(() => {
    if (removing && wasBusy.current && !rvpn.busy) {
      setRemoving(false);
      if (!rvpn.installed) showToast("success", "Radmin VPN removed");
    }
    wasBusy.current = rvpn.busy;
  }, [rvpn.busy, rvpn.installed, removing]);

  const wasInstalled = useRef<boolean | null>(null);
  useEffect(() => {
    if (!rvpn.ready) return;
    if (wasInstalled.current === null) {
      wasInstalled.current = rvpn.installed;
      return;
    }
    if (!wasInstalled.current && rvpn.installed)
      showToast("success", "Radmin VPN installed");
    wasInstalled.current = rvpn.installed;
  }, [rvpn.ready, rvpn.installed]);

  return (
    <div className={card}>
      {!rvpn.ready ? (
        <Row label="Radmin VPN">{null}</Row>
      ) : rvpn.installed || active || rvpn.hasInstaller ? (
        <Row label="Radmin VPN">
          <div className="flex min-w-0 items-center gap-3">
            {building && rvpn.step && (
              <code className={`${valueChip} animate-pulse`}>{rvpn.step}</code>
            )}
            {rvpn.installed && (
              <Button
                variant="secondary"
                className="shrink-0"
                onClick={() => setManageOpen(true)}
              >
                Manage
              </Button>
            )}
            {active ? (
              <Button
                variant="secondary"
                className="shrink-0"
                onClick={() => rvpn.stop()}
              >
                {running ? "Stop" : "Cancel"}
              </Button>
            ) : (
              <Button
                variant="primary"
                className="shrink-0"
                disabled={rvpn.busy}
                onClick={() => rvpn.run()}
              >
                Run
              </Button>
            )}
          </div>
        </Row>
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
      {manageOpen && (
        <Dialog
          title={
            <span className="flex items-center justify-between gap-3">
              Radmin VPN
              {rvpn.version && <VersionChip version={rvpn.version} />}
            </span>
          }
          onClose={() => setManageOpen(false)}
          footer={
            <>
              <Note className="mr-auto">
                It runs only while the Launcher is open.
              </Note>
              <Button variant="secondary" onClick={() => setManageOpen(false)}>
                Close
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-2">
            <div className={`${fieldRow} border-border`}>
              <span className="flex items-center gap-1.5">
                <span className="font-mono text-label text-text">Autorun</span>
                <InfoHint text="Run Radmin VPN automatically when you open the Launcher." />
              </span>
              <span className="flex h-6 items-center">
                <Switch
                  label="Autorun"
                  checked={settings?.rvpn_autorun ?? false}
                  onChange={(value) => settings?.set_rvpn_autorun(value)}
                />
              </span>
            </div>
            <ListRow label="Uninstall">
              <button
                type="button"
                aria-label="Uninstall Radmin VPN"
                disabled={rvpn.busy}
                onClick={() => {
                  setManageOpen(false);
                  setRemoving(true);
                  rvpn.uninstall();
                }}
                className={iconButton}
              >
                <RemoveIcon />
              </button>
            </ListRow>
          </div>
        </Dialog>
      )}
    </div>
  );
}
