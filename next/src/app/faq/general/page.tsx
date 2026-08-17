import type { Metadata } from "next";
import { FAQ_PAGES } from "@/config/faq";
import Link from "next/link";
import { FaqHero } from "@/components/FaqHero";
import { Note } from "@/components/Note";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";
import { ExternalLink } from "@/components/ExternalLink";

export const metadata: Metadata = FAQ_PAGES.general;

const faqs: FaqItem[] = [
  {
    id: 1,
    q: "I do not own R6S on Steam. Can I use my Ubisoft or Epic Games account?",
    a: (
      <>
        <p>
          No. The Launcher uses the Steam depot service to download old game
          seasons. This requires a valid Steam account with a registered license
          for R6S.
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
          Your credentials are required to access the Steam depot servers, where
          the old game files are stored. The Launcher uses{" "}
          <ExternalLink href="https://github.com/SteamRE/DepotDownloader">
            DepotDownloader
          </ExternalLink>
          , an open-source tool.
        </p>
        <Note className="my-3">
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
          edit the <strong>Username</strong> field (max 16 characters).
        </p>
        <Note className="my-3">
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
          activity. Open the <Link href="/settings">Settings</Link> and enable{" "}
          <strong>Discord presence</strong>.
        </p>
        <Note className="my-3">
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
        and re-downloads them without deleting your existing files.
      </p>
    ),
  },
  {
    id: 6,
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
    id: 7,
    q: "Do I need the current season of R6S installed?",
    a: (
      <p>
        No. Each season the Launcher installs runs on its own, like a separate
        game.
      </p>
    ),
  },
  {
    id: 8,
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
  {
    id: 9,
    q: "Can I set custom colors for the accent and the progress bar?",
    a: (
      <>
        <p>
          Yes. Close the Launcher and edit <code>settings.toml</code> in its
          folder. Set <code>accent</code>, <code>bar_fill</code>, or{" "}
          <code>bar_stripe</code> to any hex color.
        </p>
        <Note className="my-3">
          Missing keys appear once you pick a color in the{" "}
          <Link href="/settings">Settings</Link>.
        </Note>
      </>
    ),
  },
];

export default function General() {
  return (
    <>
      <FaqHero page="general" />
      <FaqAccordion items={faqs} />
    </>
  );
}
