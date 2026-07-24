import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Note } from "@/components/Note";
import { SectionTitle } from "@/components/SectionTitle";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";
import { ExternalLink } from "@/components/ExternalLink";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "General",
  description: "Common questions about setting up and using the Launcher.",
});

const faqs: FaqItem[] = [
  {
    id: 1,
    q: "I do not own R6S on Steam. Can I use my Ubisoft or Epic Games account?",
    a: (
      <>
        <p>
          No. The Launcher uses the Steam depot service to download old game
          seasons from the Steam servers. This requires a valid Steam account
          with a registered license for R6S. Ubisoft Connect and Epic Games
          accounts cannot be used to authenticate with the Steam servers.
        </p>
        <p>
          <strong>R6S is free on Steam</strong> — add it to your Steam library
          on its{" "}
          <ExternalLink href="https://store.steampowered.com/app/359550/">
            store page
          </ExternalLink>{" "}
          and the Launcher will work.
        </p>
      </>
    ),
  },
  {
    id: 2,
    q: "Why does the Launcher need my Steam login?",
    a: (
      <>
        <p>
          Your credentials are required to access the Steam depot servers, which
          is where the old game files are stored. The Launcher uses{" "}
          <ExternalLink href="https://github.com/SteamRE/DepotDownloader">
            DepotDownloader
          </ExternalLink>
          , an open-source tool.
        </p>
        <Note className="mt-3">
          Your password is never stored — the Launcher keeps only an encrypted
          access token, just like the Steam client.
        </Note>
      </>
    ),
  },
  {
    id: 3,
    q: "How do I change my username?",
    a: (
      <>
        <p>
          Open the <Link href="/settings">Settings</Link> in the Launcher and
          edit the <strong>Username</strong> field (max 16 characters). The
          change is saved automatically.
        </p>
        <Note className="mt-3">
          Set your username before launching the game so it applies in-game.
        </Note>
      </>
    ),
  },
  {
    id: 4,
    q: "How does the Discord presence work?",
    a: (
      <>
        <p>
          The Launcher can show the season you are playing as a Discord
          activity. Open <Link href="/settings">Settings</Link> and enable{" "}
          <strong>Discord presence</strong>.
        </p>
        <Note className="mt-3">
          <strong>Share my activity</strong> has to be enabled under{" "}
          <strong>Activity Privacy</strong> in your Discord settings.
        </Note>
      </>
    ),
  },
  {
    id: 5,
    q: "What does Verify do?",
    a: (
      <p>
        On an installed season the <strong>Manage</strong> tab shows a{" "}
        <strong>Verify</strong> button. It checks for missing or corrupted files
        and re-downloads them, repairing the install in place without deleting
        your existing files.
      </p>
    ),
  },
  {
    id: 6,
    q: "Can I pause and resume a download?",
    a: (
      <p>
        Yes. Press <strong>Pause</strong> at any point. When you come back to
        the same season, the button shows <strong>Continue download</strong>. If
        you close the Launcher during a download, it resumes automatically the
        next time you start it.
      </p>
    ),
  },
  {
    id: 7,
    q: "Can I install a season to a different drive?",
    a: (
      <p>
        Yes. Open the <Link href="/settings">Settings</Link>, press{" "}
        <strong>Add library</strong> to add a folder, and use the star to make
        it the default. When more than one library exists, the Launcher asks
        which one to use before each download.
      </p>
    ),
  },
  {
    id: 8,
    q: "How do I delete a season?",
    a: (
      <p>
        Open the season in the Launcher, switch to the <strong>Manage</strong>{" "}
        tab, and press <strong>Uninstall</strong>. The Launcher removes the
        season files for you. If the game is still running, close it first.
      </p>
    ),
  },
  {
    id: 9,
    q: "Do I need the current season of R6S installed?",
    a: (
      <p>
        No. Each season the Launcher installs is completely independent and runs
        on its own, like a separate game.
      </p>
    ),
  },
  {
    id: 10,
    platform: "linux",
    q: "Which Proton version does the Launcher use?",
    a: (
      <p>
        The Launcher picks a Proton version that you have installed. You can
        change it under <strong>Proton</strong> in the{" "}
        <Link href="/settings">Settings</Link>.
      </p>
    ),
  },
];

export default function General() {
  return (
    <>
      <Hero
        tag="Getting Started"
        corner="GEN"
        title={<em>General</em>}
        description="Common questions about setting up and using the Launcher."
      />

      <SectionTitle>Frequently Asked Questions</SectionTitle>
      <FaqAccordion items={faqs} />
    </>
  );
}
