import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { SectionTitle } from "@/components/SectionTitle";
import { CardGrid, NavCard } from "@/components/NavCard";
import { OnWindows } from "@/components/OnPlatform";
import { FAQ_PAGES } from "@/config/faq";

export const metadata: Metadata = FAQ_PAGES.index;

export default function Faq() {
  return (
    <>
      <Hero
        tag="Operation Throwback"
        corner="R6S"
        title={
          <>
            Welcome to the <em>Throwback FAQ</em>
          </>
        }
        description={FAQ_PAGES.index.description}
      />

      <SectionTitle>Setup guide</SectionTitle>
      <CardGrid>
        <NavCard
          href="/faq/general"
          {...FAQ_PAGES.general}
          arrow="— START HERE"
        />
        <NavCard
          href="/faq/multiplayer"
          {...FAQ_PAGES.multiplayer}
          arrow="— LEARN MORE"
        />
      </CardGrid>

      <SectionTitle>Support & Troubleshooting</SectionTitle>
      <CardGrid>
        <NavCard
          href="/faq/common-errors"
          {...FAQ_PAGES.commonErrors}
          arrow="— FIX ISSUES"
        />
        <OnWindows>
          <NavCard
            href="/faq/antivirus"
            {...FAQ_PAGES.antivirus}
            arrow="— READ MORE"
          />
        </OnWindows>
        <NavCard
          href="/faq/how-to-get-help"
          {...FAQ_PAGES.howToGetHelp}
          arrow="— GET HELP"
        />
      </CardGrid>

      <SectionTitle>Tools & Mods</SectionTitle>
      <CardGrid>
        <NavCard
          href="/faq/liberator"
          {...FAQ_PAGES.liberator}
          arrow="— LEARN MORE"
        />
        <NavCard
          href="/faq/heated-metal"
          {...FAQ_PAGES.heatedMetal}
          arrow="— LEARN MORE"
        />
        <NavCard
          href="/faq/cheat-engine"
          {...FAQ_PAGES.cheatEngine}
          arrow="— LEARN MORE"
        />
      </CardGrid>
    </>
  );
}
