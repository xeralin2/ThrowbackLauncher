"use client";

import Image from "next/image";
import { useState } from "react";
import {
  sectionOrder,
  users,
  type CreditRole,
  type CreditUser,
} from "@/content/credits";
import { ExternalLink } from "./ExternalLink";
import { SectionTitle } from "./SectionTitle";

const ON_ERROR_AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";

const roleColor: Record<CreditRole, string> = {
  admin: "text-[#c61200]",
  moderator: "text-[#c8c840]",
  developer: "text-[#4a9fd4]",
  seniorhelper: "text-[#00f365]",
  helper: "text-[#2ecc71]",
};

const roleRank: Record<CreditRole, number> = {
  admin: 0,
  moderator: 1,
  developer: 2,
  seniorhelper: 3,
  helper: 4,
};

const roleTitle: Record<CreditRole, string> = {
  admin: "Administrator",
  moderator: "Moderator",
  developer: "Developer",
  seniorhelper: "Senior Helper",
  helper: "Helper",
};

function Avatar({ user }: { user: CreditUser }) {
  const [src, setSrc] = useState(user.avatar);
  return (
    <Image
      src={src}
      alt={user.name}
      width={400}
      height={400}
      className="block aspect-square w-full object-cover"
      onError={() => {
        if (src !== ON_ERROR_AVATAR) setSrc(ON_ERROR_AVATAR);
      }}
    />
  );
}

function DevCard({ user }: { user: CreditUser }) {
  const hasLinks = Boolean(user.github || user.dono);
  return (
    <div className="dev-card card-lift overflow-hidden">
      <Avatar user={user} />
      <div className="flex flex-col border-t border-border p-3">
        <div className="mb-0.5 flex items-center justify-between gap-2">
          <span className="font-display text-base font-bold text-text">
            {user.name}
          </span>
          {hasLinks && (
            <span className="flex shrink-0 gap-1.5">
              {user.github && (
                <ExternalLink
                  href={user.github}
                  aria-label="GitHub"
                  className="block opacity-60 transition-[opacity,transform] duration-150 hover:[transform:scale(1.15)] hover:opacity-100"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="block h-4 w-4"
                    fill="#fff"
                  >
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                </ExternalLink>
              )}
              {user.dono && (
                <ExternalLink
                  href={user.dono}
                  aria-label="Donate"
                  className="block opacity-60 transition-[opacity,transform] duration-150 hover:[transform:scale(1.15)] hover:opacity-100"
                >
                  <Image
                    src="/media/others/piggy-bank.svg"
                    alt="Donate"
                    width={16}
                    height={16}
                    className="block h-4 w-4"
                  />
                </ExternalLink>
              )}
            </span>
          )}
        </div>
        <div
          className={`mb-2 font-mono text-[0.6rem] uppercase tracking-[0.08em] ${roleColor[user.role]}`}
        >
          {roleTitle[user.role]}
        </div>
        {user.tags.length > 0 && (
          <div className="mt-[0.4rem] flex flex-wrap content-start gap-[0.3rem]">
            {user.tags.map((tag) => (
              <span
                key={tag}
                className="whitespace-nowrap rounded-[3px] border border-border bg-surface-2 px-[0.45rem] py-[0.15rem] font-mono text-[0.6rem] text-text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CreditsGrid() {
  return (
    <div className="flex flex-col gap-10">
      {sectionOrder.map(({ id, label }) => {
        const sectionUsers = users
          .filter((user) => user.sections.includes(id))
          .sort(
            (a, b) =>
              roleRank[a.role] - roleRank[b.role] ||
              a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
          );
        if (sectionUsers.length === 0) return null;
        return (
          <div key={id}>
            <SectionTitle className="">{label}</SectionTitle>
            <div className="dev-card-row grid items-start grid-cols-[repeat(auto-fill,minmax(min(200px,100%),1fr))] gap-4 max-[32.5em]:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
              {sectionUsers.map((user) => (
                <DevCard key={user.name} user={user} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
