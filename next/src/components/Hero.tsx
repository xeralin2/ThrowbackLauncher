import Image from "next/image";
import type { ReactNode } from "react";
import { site } from "@/config/site";

type HeroProps = {
  tag: string;
  corner: string;
  title: ReactNode;
  description: string;
};

export function Hero({ tag, corner, title, description }: HeroProps) {
  return (
    <div className="relative mb-8 flex min-h-[160px] overflow-hidden rounded-[10px] border border-action-edge bg-[linear-gradient(135deg,#0d0d0f_0%,var(--color-action-veil)_50%,#0d0d0f_100%)] before:pointer-events-none before:absolute before:inset-0 before:z-[1] before:rounded-[inherit] before:bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.06)_2px,rgba(0,0,0,0.06)_4px)] before:content-[''] after:pointer-events-none after:absolute after:inset-0 after:z-[3] after:animate-scan-move after:bg-[linear-gradient(transparent,color-mix(in_srgb,var(--color-action)_2.5%,transparent)_50%,transparent)] after:bg-[length:100%_60px] after:bg-no-repeat after:content-['']">
      <Image
        src={site.ogImage}
        alt=""
        fill
        sizes="100vw"
        priority
        className="hero-art pointer-events-none select-none object-cover object-center opacity-[0.28]"
      />
      <div className="absolute inset-0 animate-hero-glow bg-[radial-gradient(ellipse_at_70%_50%,var(--color-action-glow)_0%,transparent_65%)]" />
      <div className="relative z-[2] flex flex-1 flex-col justify-center px-10 py-7 max-[48em]:px-6 max-[48em]:py-5">
        <div className="mb-[0.6rem] flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-action before:h-px before:w-5 before:bg-action before:content-['']">
          {tag}
        </div>
        <h1 className="mb-2 font-display text-[2.4rem] font-bold leading-none text-text max-[48em]:text-[1.9rem] max-[32.5em]:text-[1.6rem] min-[100em]:text-[2.8rem] [&_em]:not-italic [&_em]:text-action">
          {title}
        </h1>
        <p className="text-[0.9rem] leading-[1.6] text-text">{description}</p>
      </div>
      <div className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 animate-flicker select-none font-display text-[7rem] font-bold leading-none text-[color-mix(in_srgb,var(--color-action)_22%,transparent)] max-[48em]:hidden">
        {corner}
      </div>
    </div>
  );
}
