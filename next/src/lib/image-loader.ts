import type { ImageLoaderProps } from "next/image";
import coverWidths from "@/config/cover-widths.json";

const variantWidths = coverWidths.slice(0, -1);

export default function imageLoader({ src, width }: ImageLoaderProps): string {
  if (!src.startsWith("/cover/")) return src;
  const variant = variantWidths.find((value) => value >= width);
  return variant ? src.replace("/cover/", `/cover/${variant}/`) : src;
}
