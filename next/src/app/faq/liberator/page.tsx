import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { SectionTitle } from "@/components/SectionTitle";
import { Prose } from "@/components/Prose";
import { SeasonTable } from "@/components/SeasonTable";
import {
  SUPPORTED_Y12,
  SUPPORTED_Y34,
  UNLOCK_ALL_SEASONS,
} from "@/config/liberator-builds";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Liberator",
  description:
    "Unlock all cosmetics and play additional game modes in older Rainbow Six Siege seasons.",
});

const faqs: FaqItem[] = [
  {
    id: 2,
    q: "Liberator is crashing the game, how do I fix it?",
    a: (
      <p>
        Make sure Liberator is enabled <strong>before</strong> launching the
        game. If the game is still crashing, verify that it is fully closed and
        end any remaining R6S processes before trying again.
      </p>
    ),
  },
  {
    id: 3,
    q: "It says this game build is not supported, what does that mean?",
    a: (
      <p>
        Liberator only supports specific game builds. All supported builds are
        listed in the <strong>Supported Seasons</strong> section above.
      </p>
    ),
  },
  {
    id: 4,
    q: "The game crashes when playing Terrorist Hunt or the Outbreak event with other players.",
    a: (
      <p>
        The order of operations matters here. Create the local custom game first
        and have other players join before selecting the game mode. Make sure
        everyone is on the <strong>blue team</strong> before starting.
      </p>
    ),
  },
];

export default function Liberator() {
  return (
    <>
      <Hero
        tag="Tools & Mods"
        corner="LIB"
        title={<em>Liberator</em>}
        description="Unlock all cosmetics and play additional game modes in older Rainbow Six Siege seasons."
      />

      <SectionTitle>How to Use It</SectionTitle>
      <Prose>
        <h3>Enabling it</h3>
        <ol>
          <li>
            Open the <Link href="/liberator">Liberator</Link> page in the
            Launcher
          </li>
          <li>Make sure Liberator is enabled</li>
          <li>Launch the game from the Launcher</li>
        </ol>

        <h3>Custom game</h3>
        <ol>
          <li>Create a local custom game</li>
          <li>
            Select the game mode in the <strong>Playlist</strong> tab on the
            Liberator page
          </li>
          <li>
            If you want to play Terrorist Hunt or the Outbreak event, make sure
            you are on the <strong>blue team</strong>, then start the game
          </li>
        </ol>
      </Prose>

      <SectionTitle>Supported Seasons</SectionTitle>
      <Prose>
        <div className="flex flex-wrap items-start gap-x-6">
          <SeasonTable rows={SUPPORTED_Y12} />
          <SeasonTable rows={SUPPORTED_Y34} showEvent />
          <SeasonTable rows={UNLOCK_ALL_SEASONS} />
        </div>
      </Prose>

      <SectionTitle>Frequently Asked Questions</SectionTitle>
      <FaqAccordion items={faqs} />
    </>
  );
}
