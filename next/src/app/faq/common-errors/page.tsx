import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Note } from "@/components/Note";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";
import { ExternalLink } from "@/components/ExternalLink";
import { OnWindows } from "@/components/OnPlatform";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Common Errors",
  description:
    "Solutions to the most frequently encountered game issues and errors.",
});

const faqs: FaqItem[] = [
  {
    id: 10,
    q: "I am getting errors while downloading. What should I do?",
    a: (
      <>
        <p>
          Most errors during download do not affect the final result and can be
          ignored. These specific errors have known causes.
        </p>
        <ul>
          <li>
            <strong>Encountered error downloading chunk</strong> — Safe to
            ignore, since the Steam servers were briefly unreachable and the
            Launcher retries automatically
          </li>
          <li>
            <strong>Depot is not available</strong> — You do not own R6S on
            Steam
          </li>
          <li>
            <strong>Failed to allocate file</strong> — Free up storage space on
            the install drive
          </li>
          <li>
            <strong>The process cannot access the file</strong> — Close any
            program that might be interfering, such as
            <OnWindows> your antivirus or</OnWindows> another game instance
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 1,
    q: "Why is my game stuck on controller input?",
    a: (
      <ol>
        <li>
          <strong>Restart the game</strong> — This mostly happens on the first
          launch after a download and is gone for good afterwards
        </li>
        <li>
          <strong>Unplug your controller</strong> — If that did not help,
          restart without it and plug it back in afterwards
        </li>
      </ol>
    ),
  },
  {
    id: 2,
    q: "How do I fix the MSVCRXXX.dll error?",
    display: (
      <>
        How do I fix the <code>MSVCRXXX.dll</code> error?
      </>
    ),
    platform: "windows",
    a: (
      <>
        <p>
          This error means your system is missing a required Microsoft Visual
          C++ Redistributable package.
        </p>
        <ol>
          <li>
            Visit this{" "}
            <ExternalLink href="https://github.com/abbodi1406/vcredist/releases/latest">
              repository
            </ExternalLink>
          </li>
          <li>
            Download <code>VisualCppRedist_AIO_x86_x64.exe</code> and run it as
            administrator
          </li>
          <li>Restart your computer and try launching the game again</li>
        </ol>
        <Note className="mt-3">
          If the error persists, make sure Windows is fully up to date, then
          repeat the steps above.
        </Note>
      </>
    ),
  },
  {
    id: 3,
    q: "How do I fix the uplay_rx_loader64.dll error?",
    display: (
      <>
        How do I fix the <code>uplay_rx_loader64.dll</code> error?
      </>
    ),
    platform: "windows",
    a: (
      <>
        <p>
          This error usually occurs when your antivirus has blocked or removed a
          required file.
        </p>
        <ol>
          <li>
            Add your library folder as an exclusion in your antivirus settings —
            the <Link href="/faq/antivirus#q2">Antivirus page</Link> has the
            full steps
          </li>
          <li>
            Use <strong>Verify</strong> in the <strong>Manage</strong> tab of
            the season to restore the removed files
          </li>
        </ol>
      </>
    ),
  },
  {
    id: 4,
    q: "How do I fix missing or corrupt DLL files?",
    a: (
      <>
        <p>
          If you get an error mentioning any of the following files, the fix is
          the same for all of them.
        </p>
        <ul>
          <li>
            <code>amd_ags_x64.dll</code>
          </li>
          <li>
            <code>gfsdk_ssao_d3d11.win64.dll</code>
          </li>
          <li>
            <code>vivoxsdk_x64.dll</code>
          </li>
          <li>
            <code>bink2w64.dll</code>
          </li>
        </ul>
        <ol>
          <li>
            Delete the specified <code>.dll</code> file from the season folder
            inside your library
          </li>
          <li>
            Use <strong>Verify</strong> in the <strong>Manage</strong> tab of
            the season to restore missing files
          </li>
        </ol>
      </>
    ),
  },
  {
    id: 5,
    q: "My old R6S version opens the current version or Ubisoft Connect instead.",
    platform: "windows",
    a: (
      <>
        <ol>
          <li>
            <strong>Check your antivirus</strong> — Loader files may be flagged
            and removed, so make sure your library folder has an exclusion set
            up (see the <Link href="/faq/antivirus#q2">Antivirus page</Link>)
          </li>
          <li>
            <strong>Verify your files</strong> — Use <strong>Verify</strong> in
            the Launcher to restore the correct files
          </li>
        </ol>
        <p>Once done, try launching the game again.</p>
      </>
    ),
  },
  {
    id: 6,
    q: 'My game is stuck on "Preparing Content". How do I fix it?',
    display: (
      <>
        My game is stuck on <em>Preparing Content</em>. How do I fix it?
      </>
    ),
    a: (
      <>
        <ol>
          <li>
            <strong>Restart the game</strong> — Close it completely with{" "}
            <strong>Stop</strong> in the Launcher
            <OnWindows> or via Task Manager</OnWindows> and try again
          </li>
          <li>
            <strong>Verify your files</strong> — Use <strong>Verify</strong> in
            the <strong>Manage</strong> tab of the season to check for missing
            or corrupted files
          </li>
          <OnWindows>
            <li>
              <strong>Check your antivirus</strong> — If files were removed,
              exclude your library folder (see the{" "}
              <Link href="/faq/antivirus#q2">Antivirus page</Link>) and run{" "}
              <strong>Verify</strong> again
            </li>
          </OnWindows>
        </ol>
        <Note className="mt-3">
          This issue usually resolves itself after a restart. Verifying files is
          a reliable second step.
        </Note>
      </>
    ),
  },
  {
    id: 7,
    q: "Why is my .exe file missing?",
    display: (
      <>
        Why is my <code>.exe</code> file missing?
      </>
    ),
    platform: "windows",
    a: (
      <>
        <p>
          If the executable is missing, it is usually caused by your antivirus
          removing it.
        </p>
        <ol>
          <li>
            Add your library folder as an exclusion in your antivirus settings —
            the <Link href="/faq/antivirus#q2">Antivirus page</Link> has the
            full steps
          </li>
          <li>
            Use <strong>Verify</strong> in the <strong>Manage</strong> tab of
            the season to re-download any missing files
          </li>
        </ol>
        <Note className="mt-3">
          If files keep going missing after verifying, double-check that your
          antivirus exclusion is set correctly before running{" "}
          <strong>Verify</strong> again.
        </Note>
      </>
    ),
  },
  {
    id: 8,
    q: "My game is in Russian. How do I switch to English?",
    a: (
      <>
        <p>
          Some Steam accounts own a regional version of the game called SKU RUS,
          which is in Russian by default. If yours is affected, switch the
          language with these steps.
        </p>
        <ol>
          <li>
            Download the{" "}
            <a href="/downloads/localization.lang" download="localization.lang">
              <code>localization.lang</code>
            </a>{" "}
            file
          </li>
          <li>
            Move it into the folder of the affected season inside your library,
            replacing the existing file
          </li>
          <li>Launch the game — it should now be in English</li>
        </ol>
        <Image
          src="/media/others/sku-rus.webp"
          alt="SKU RUS regions map"
          width={768}
          height={112}
        />
      </>
    ),
  },
  {
    id: 9,
    q: 'Why do I get a "User profile loading failed" error?',
    display: (
      <>
        Why do I get a <em>User profile loading failed</em> error?
      </>
    ),
    a: (
      <p>
        This error is expected and does not affect gameplay. Click{" "}
        <strong>OK</strong> and the game will continue as normal.
      </p>
    ),
  },
];

export default function CommonErrors() {
  return (
    <>
      <Hero
        tag="Troubleshooting"
        corner="ERR"
        title={<em>Common Errors</em>}
        description="Solutions to the most frequently encountered game issues and errors."
      />
      <FaqAccordion items={faqs} />
    </>
  );
}
