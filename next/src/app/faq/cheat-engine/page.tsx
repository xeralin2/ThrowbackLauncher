import type { Metadata } from "next";
import { FAQ_PAGES } from "@/config/faq";
import Link from "next/link";
import { FaqHero } from "@/components/FaqHero";
import { Note } from "@/components/Note";
import { SectionTitle } from "@/components/SectionTitle";
import { Prose } from "@/components/Prose";
import { ExternalLink } from "@/components/ExternalLink";
import { LinkButton } from "@/components/LinkButton";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";
import { OnLinux, OnWindows } from "@/components/OnPlatform";
import { CheatEngineInstaller } from "@/components/CheatEngineInstaller";

export const metadata: Metadata = FAQ_PAGES.cheatEngine;

const tables = [
  {
    name: "Y3S1 Chimera",
    description: "Spawns far more enemies across all Terrorist Hunt modes.",
    file: "y3s1-chimera.ct",
    download: "Y3S1_Chimera.ct",
  },
  {
    name: "Y5S3 Shadow Legacy",
    description:
      "Adds mass spawns, health and ammo tweaks, near-unlimited survivability, longer defuse timers, and outside-zone access to Terrorist Hunt.",
    file: "y5s3-shadowlegacy.ct",
    download: "Y5S3_ShadowLegacy.ct",
  },
];

const faqs: FaqItem[] = [
  {
    id: 1,
    q: "Do the tables work on other seasons?",
    a: (
      <p>
        No. A table only works with the season named on its card above. On any
        other build the memory addresses do not line up.
      </p>
    ),
  },
  {
    id: 2,
    q: "Do I have to load the table every time?",
    a: (
      <p>
        Yes. A table loads into memory for the current session only and does not
        modify any game files.
      </p>
    ),
  },
];

export default function CheatEngine() {
  return (
    <>
      <FaqHero page="cheatEngine" />

      <OnWindows>
        <Note className="mb-6">
          Cheat Engine and the tables below are often flagged by antivirus
          software as a false positive. You may need to add an exclusion — see
          the <Link href="/faq/antivirus">Antivirus</Link> page for details.
        </Note>
      </OnWindows>

      <SectionTitle>Cheat Engine Setup</SectionTitle>
      <OnWindows>
        <Prose>
          <ol>
            <li>
              Download{" "}
              <ExternalLink href="https://cheatengine.org/downloads.php">
                Cheat Engine
              </ExternalLink>{" "}
              for Windows and run the installer
            </li>
            <li>
              Click through the installer and{" "}
              <strong>deny any bundled offers</strong> to avoid adware
            </li>
            <li>
              Open <code>Config.toml</code> in the season folder
            </li>
            <li>
              Add the path of your installed Cheat Engine to the{" "}
              <code>tools</code> entry, for example{" "}
              <code>
                tools = [&apos;C:\Program Files\Cheat Engine\Cheat
                Engine.exe&apos;]
              </code>
            </li>
            <li>Cheat Engine opens alongside the game</li>
          </ol>
        </Prose>
      </OnWindows>
      <OnLinux>
        <Prose>
          <ol>
            <li>
              Download{" "}
              <ExternalLink href="https://cheatengine.org/downloads.php">
                Cheat Engine
              </ExternalLink>{" "}
              for Windows
            </li>
            <li>
              <CheatEngineInstaller /> and add it to an installed season
            </li>
            <li>
              Pick the installer and click through it, denying{" "}
              <strong>any bundled offers</strong> to avoid adware
            </li>
            <li>Cheat Engine opens alongside the game</li>
          </ol>
        </Prose>
      </OnLinux>

      <SectionTitle>How to Use Cheat Engine</SectionTitle>
      <Prose>
        <ol>
          <li>Dismiss the pop-ups the first time you open Cheat Engine</li>
          <li>
            Download a table below
            <OnWindows>
              {" "}
              and double-click the <code>.ct</code> file to load it, or load it
              manually via the <strong>folder icon</strong> if no entry appears
              in the cheat list at the bottom of the Cheat Engine window
            </OnWindows>
            <OnLinux>
              {" "}
              and load it in Cheat Engine via the <strong>folder icon</strong> —
              your host folders appear under <code>Z:\</code>
            </OnLinux>
          </li>
          <li>
            Launch the game, then attach Cheat Engine by clicking the{" "}
            <strong>monitor icon</strong> and selecting the game process
          </li>
          <li>
            Tick the <strong>checkbox</strong> next to the table entry to
            activate it
          </li>
        </ol>
      </Prose>

      <SectionTitle>Cheat Tables</SectionTitle>
      <div className="mb-8 flex flex-col gap-4">
        {tables.map((table) => (
          <div
            key={table.file}
            className="rounded-lg border border-border bg-surface p-5"
          >
            <h3 className="font-display text-[1.05rem] font-bold text-text">
              {table.name}
            </h3>
            <p className="mb-3 mt-1 text-ui leading-[1.5] text-text-muted">
              {table.description}
            </p>
            <LinkButton href={`/ct/${table.file}`} download={table.download}>
              Download
            </LinkButton>
          </div>
        ))}
      </div>

      <SectionTitle>Frequently Asked Questions</SectionTitle>
      <FaqAccordion items={faqs} />
    </>
  );
}
