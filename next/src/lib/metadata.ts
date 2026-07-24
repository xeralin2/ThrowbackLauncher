import type { Metadata } from "next";
import { site } from "@/config/site";

export const baseMetadata: Metadata = {
  title: {
    default: site.name,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
};

export function pageMetadata(opts: {
  title: string;
  description: string;
}): Metadata {
  return {
    title: opts.title,
    description: opts.description,
  };
}
