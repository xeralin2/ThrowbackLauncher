"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { inputClasses } from "@/components/SettingsControls";
import { useDownloader } from "@/lib/bridge";

function PasswordInput({
  value,
  placeholder,
  autoFocus = false,
  onChange,
}: {
  value: string;
  placeholder?: string;
  autoFocus?: boolean;
  onChange: (value: string) => void;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative w-full">
      <input
        type={show ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full ${inputClasses} pr-10`}
      />
      <button
        type="button"
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow((value) => !value)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted transition-colors hover:text-text"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
          {!show && <line x1="4" y1="20" x2="20" y2="4" />}
        </svg>
      </button>
    </div>
  );
}

export function SteamLoginModal() {
  const [override, setOverride] = useState<string | null>();
  const [loginText, setLoginText] = useState("");
  const [loginAccount, setLoginAccount] = useState("");

  const dl = useDownloader({
    onLogin: (kind) => setOverride(kind),
    onDone: () => setOverride(null),
  });

  const loginKind = override === undefined ? dl.loginKind || null : override;

  function submitLogin() {
    if (loginKind === "account") {
      if (!loginAccount.trim() || !loginText.length) return;
      dl.submitAccountLogin(loginAccount.trim(), loginText);
    } else {
      if (!loginText.length) return;
      dl.submitLogin(loginText);
    }
    setLoginText("");
    setLoginAccount("");
    setOverride(null);
  }

  function cancelLogin() {
    dl.cancel();
    setOverride(null);
    setLoginText("");
    setLoginAccount("");
  }

  if (!loginKind) return null;
  return (
    <Dialog
      title={loginKind === "guard" ? "Steam Guard" : "Steam login"}
      onClose={cancelLogin}
      onConfirm={submitLogin}
      footer={
        <>
          {loginKind === "account" && (
            <Link
              href="/faq/general#q2"
              className="mr-auto self-center text-ui text-text-muted underline underline-offset-2 transition-colors hover:text-text"
            >
              Why does the Launcher need my Steam login?
            </Link>
          )}
          <Button variant="secondary" onClick={cancelLogin}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={
              loginKind === "account"
                ? !loginAccount.trim() || !loginText.length
                : !loginText.length
            }
            onClick={submitLogin}
          >
            Log in
          </Button>
        </>
      }
    >
      {loginKind === "account" ? (
        <>
          <p className="mb-4 text-body text-text-muted">
            Log in with your Steam account to start the download.
          </p>
          <input
            type="text"
            value={loginAccount}
            autoFocus
            placeholder="Account name"
            onChange={(event) => setLoginAccount(event.target.value)}
            className={`mb-2 w-full ${inputClasses}`}
          />
          <PasswordInput
            value={loginText}
            placeholder="Password"
            onChange={setLoginText}
          />
        </>
      ) : (
        <>
          <p className="mb-4 text-body text-text-muted">
            {loginKind === "guard"
              ? "Enter your Steam Guard code"
              : "Enter your Steam password"}
          </p>
          {loginKind === "guard" ? (
            <input
              type="text"
              value={loginText}
              autoFocus
              onChange={(event) => setLoginText(event.target.value)}
              className={`w-full ${inputClasses}`}
            />
          ) : (
            <PasswordInput
              value={loginText}
              autoFocus
              onChange={setLoginText}
            />
          )}
        </>
      )}
    </Dialog>
  );
}
