import type { Metadata } from "next";
import { FAQ_PAGES } from "@/config/faq";
import Link from "next/link";
import { FaqHero } from "@/components/FaqHero";
import { Note } from "@/components/Note";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";

export const metadata: Metadata = FAQ_PAGES.antivirus;

const faqs: FaqItem[] = [
  {
    id: 1,
    q: "My antivirus is blocking the game. What should I do?",
    a: (
      <>
        <p>
          Some antivirus programs flag game files as false positives. The fix is
          to add both your library folder and the Launcher install folder as
          exclusions.
        </p>
        <ol>
          <li>
            Search for <strong>Virus & Threat Protection</strong> in the Windows
            start menu
          </li>
          <li>
            Click <strong>Manage settings</strong> under{" "}
            <em>Virus & Threat Protection Settings</em>
          </li>
          <li>
            Scroll down to <em>Exclusions</em> and click{" "}
            <strong>Add or remove exclusions</strong>
          </li>
          <li>
            Click <strong>Add an exclusion</strong>, select{" "}
            <strong>Folder</strong>, and choose your library folder, then repeat
            for the Launcher install folder at{" "}
            <code>%LOCALAPPDATA%\ThrowbackLauncher</code>
          </li>
          <li>Restart your computer and try launching the game again</li>
        </ol>
        <Note className="my-3">
          Use <strong>Verify</strong> in the <strong>Manage</strong> tab of the
          season to restore removed game files.
        </Note>
      </>
    ),
  },
  {
    id: 2,
    q: "My antivirus deleted a game file. How do I get it back?",
    a: (
      <ol>
        <li>
          Add both your library folder and the Launcher install folder as
          exclusions in your antivirus settings
        </li>
        <li>
          If the file was part of Heated Metal, clear the App cache under{" "}
          <Link href="/settings">Settings</Link> so the flagged loader files are
          not reused
        </li>
        <li>
          Use <strong>Verify</strong> in the <strong>Manage</strong> tab of the
          season to restore the files
        </li>
      </ol>
    ),
  },
  {
    id: 3,
    q: "I use a third-party antivirus. Does the same apply?",
    a: (
      <p>
        Yes. The process is essentially the same for all antivirus software. The
        exact steps vary by product, but look for an <strong>Exclusions</strong>
        , <strong>Exceptions</strong>, or <strong>Whitelist</strong> section in
        your antivirus settings.
      </p>
    ),
  },
];

export default function Antivirus() {
  return (
    <>
      <FaqHero page="antivirus" />
      <FaqAccordion items={faqs} />
    </>
  );
}
