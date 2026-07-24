import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { CreditsGrid } from "@/components/CreditsGrid";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Credits",
  description:
    "A big thank you to everyone who has contributed to making Operation Throwback possible.",
});

export default function Credits() {
  return (
    <>
      <Hero
        tag="Community"
        corner="TY"
        title={<em>Credits</em>}
        description="A big thank you to everyone who has contributed to making Operation Throwback possible."
      />
      <CreditsGrid />
    </>
  );
}
