import type { Metadata } from "next";
import { FAQ_PAGES } from "@/config/faq";
import Link from "next/link";
import { FaqHero } from "@/components/FaqHero";
import { SectionTitle } from "@/components/SectionTitle";
import { Prose } from "@/components/Prose";
import { SupportedSeasons } from "@/components/SupportedSeasons";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";

export const metadata: Metadata = FAQ_PAGES.liberator;

const faqs: FaqItem[] = [
  {
    id: 1,
    q: "Liberator is crashing the game, how do I fix it?",
    a: (
      <p>
        Make sure Liberator is enabled <strong>before</strong> launching the
        game. If the game is still crashing, end any remaining R6S processes
        before trying again.
      </p>
    ),
  },
  {
    id: 2,
    q: "It says this game build is not supported, what does that mean?",
    a: (
      <p>
        Liberator only supports the game builds listed in the{" "}
        <strong>Supported Seasons</strong> section above.
      </p>
    ),
  },
  {
    id: 3,
    q: "The game crashes when playing Terrorist Hunt or the Outbreak event with other players.",
    a: (
      <p>
        Create the local custom game first and have other players join before
        selecting the game mode. Make sure everyone is on the{" "}
        <strong>blue team</strong> before starting.
      </p>
    ),
  },
];

export default function Liberator() {
  return (
    <>
      <FaqHero page="liberator" />

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
      <SupportedSeasons />

      <SectionTitle>Frequently Asked Questions</SectionTitle>
      <FaqAccordion items={faqs} />
    </>
  );
}
