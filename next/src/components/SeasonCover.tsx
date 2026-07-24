import Image from "next/image";
import type { Season } from "@/lib/bridge";

export const coverFade =
  "absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/90 via-black/55 to-transparent";

export function SeasonCover({
  cover,
  sizes,
  priority = false,
  imgClassName = "",
}: {
  cover: string | null;
  sizes: string;
  priority?: boolean;
  imgClassName?: string;
}) {
  return cover ? (
    <Image
      src={cover}
      alt=""
      fill
      priority={priority}
      sizes={sizes}
      className={`object-cover object-center ${imgClassName}`.trim()}
    />
  ) : (
    <div className="absolute inset-0 bg-gradient-to-br from-[#1a0d12] to-[#0d0d0f]" />
  );
}

export function CardCover({
  season,
  sizes,
}: {
  season: Season;
  sizes: string;
}) {
  return season.hm ? (
    <Image
      src="/media/others/hm.webp"
      alt=""
      fill
      sizes={sizes}
      className="object-cover"
    />
  ) : (
    <>
      <SeasonCover cover={season.cover} sizes={sizes} />
      <div className={coverFade} />
    </>
  );
}
