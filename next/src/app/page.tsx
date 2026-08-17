"use client";

import Link from "next/link";
import { SeasonBrowser } from "@/components/SeasonBrowser";
import { useHomeSeasons } from "@/lib/bridge";

export default function HomePage() {
  const [seasons, refresh] = useHomeSeasons();

  return (
    <SeasonBrowser
      seasons={seasons}
      emptyMessage={
        <>
          No seasons installed yet — grab your first one from the{" "}
          <Link href="/download">Download</Link> tab.
        </>
      }
      layout="dashboard"
      onReturn={refresh}
    />
  );
}
