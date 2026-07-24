"use client";

import { Fragment, useEffect, useRef } from "react";
import { Button, buttonBase } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { ExternalLink } from "@/components/ExternalLink";
import { codeChip } from "@/components/Tag";
import { VersionChip } from "@/components/VersionChip";
import {
  useDownloaderRunning,
  useUpdate,
  type UpdateComponent,
} from "@/lib/bridge";
import { dismissToast, showToast } from "@/lib/toast";

const STATUS_KEY = "update-status";

type Note = UpdateComponent["notes"][number];
type Block =
  | { kind: "heading"; text: string }
  | { kind: "text"; text: string }
  | { kind: "list"; ordered: boolean; items: Note[] };

function toBlocks(notes: Note[]): Block[] {
  const blocks: Block[] = [];
  for (const note of notes) {
    if (note.kind === "heading" || note.kind === "text") {
      blocks.push({ kind: note.kind, text: note.text });
      continue;
    }
    const ordered = note.kind === "number";
    const last = blocks[blocks.length - 1];
    if (last?.kind === "list" && last.ordered === ordered)
      last.items.push(note);
    else blocks.push({ kind: "list", ordered, items: [note] });
  }
  return blocks;
}

function NoteList({ ordered, items }: { ordered: boolean; items: Note[] }) {
  const List = ordered ? "ol" : "ul";
  return (
    <List
      className={`space-y-0.5 pl-4 text-ui text-text-muted ${
        ordered ? "list-decimal" : "list-disc"
      }`}
    >
      {groupNotes(items).map((note, index) => (
        <li key={index}>
          {renderNote(note.text)}
          {note.children.length > 0 && (
            <ul className="list-[circle] space-y-0.5 pl-4">
              {note.children.map((child, childIndex) => (
                <li key={childIndex}>{renderNote(child)}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </List>
  );
}

function Notes({ notes }: { notes: UpdateComponent["notes"] }) {
  return (
    <div className="mt-3 flex flex-col gap-2">
      {toBlocks(notes).map((block, index) => {
        if (block.kind === "heading") {
          return (
            <div
              key={index}
              className="mt-1.5 font-display text-[0.9rem] font-bold text-text first:mt-0"
            >
              {renderNote(block.text)}
            </div>
          );
        }
        if (block.kind === "text") {
          return (
            <p key={index} className="text-ui text-text-muted">
              {renderNote(block.text)}
            </p>
          );
        }
        return (
          <NoteList key={index} ordered={block.ordered} items={block.items} />
        );
      })}
    </div>
  );
}

function groupNotes(notes: UpdateComponent["notes"]) {
  const groups: { text: string; children: string[] }[] = [];
  for (const note of notes) {
    if (note.level > 0 && groups.length > 0) {
      groups[groups.length - 1].children.push(note.text);
    } else {
      groups.push({ text: note.text, children: [] });
    }
  }
  return groups;
}

const CODE_TOKEN = /(`[^`]+`)/g;
const CODE_EXACT = /^`[^`]+`$/;
const LINK_TOKEN = /(\[[^\]]+\]\((?:[^()\s]|\([^()\s]*\))+\))/g;
const LINK_EXACT = /^\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)$/;
const EMPHASIS_TOKEN =
  /(\*\*[^\s*](?:[^*]*[^\s*])?\*\*|~~[^\s~](?:[^~]*[^\s~])?~~|\*[^\s*](?:[^*]*[^\s*])?\*|(?<!\w)_[^\s_](?:[^_]*[^\s_])?_(?!\w))/g;
const BOLD_EXACT = /^\*\*[^\s*](?:[^*]*[^\s*])?\*\*$/;
const STRIKE_EXACT = /^~~[^\s~](?:[^~]*[^\s~])?~~$/;
const EM_EXACT = /^\*[^\s*](?:[^*]*[^\s*])?\*$|^_[^\s_](?:[^_]*[^\s_])?_$/;

function renderEmphasis(text: string) {
  return text.split(EMPHASIS_TOKEN).map((part, index) => {
    if (BOLD_EXACT.test(part)) {
      return (
        <strong key={index} className="font-semibold text-text">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (STRIKE_EXACT.test(part)) {
      return (
        <s key={index} className="opacity-70">
          {part.slice(2, -2)}
        </s>
      );
    }
    if (EM_EXACT.test(part)) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function renderLinks(text: string) {
  return text.split(LINK_TOKEN).map((part, index) => {
    const link = LINK_EXACT.exec(part);
    if (link) {
      return (
        <ExternalLink
          key={index}
          href={link[2]}
          className="text-link hover:underline"
        >
          {link[1]}
        </ExternalLink>
      );
    }
    return <Fragment key={index}>{renderEmphasis(part)}</Fragment>;
  });
}

function renderNote(note: string) {
  return note.split(CODE_TOKEN).map((part, index) => {
    if (CODE_EXACT.test(part)) {
      return (
        <code key={index} className={codeChip}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={index}>{renderLinks(part)}</Fragment>;
  });
}

export default function UpdatesPage() {
  const downloading = useDownloaderRunning();
  const update = useUpdate();

  const wasChecking = useRef(false);
  const manualCheck = useRef(false);
  useEffect(() => {
    if (wasChecking.current && !update.checking) {
      const wasManual = manualCheck.current;
      manualCheck.current = false;
      if (update.components.length > 0) {
        dismissToast(STATUS_KEY);
      } else if (update.checkError === "rate_limit") {
        showToast("warning", "GitHub rate limit reached", {
          key: STATUS_KEY,
        });
      } else if (update.checkError === "error") {
        showToast("warning", "Update check failed", {
          key: STATUS_KEY,
        });
      } else if (wasManual) {
        showToast("success", "Everything is up to date", {
          key: STATUS_KEY,
        });
      }
    }
    wasChecking.current = update.checking;
  }, [update.checking, update.components.length, update.checkError]);

  return (
    <>
      <h1 className="mb-4 font-display text-[1.9rem] font-bold text-text">
        Updates
      </h1>

      <Callout label="// NOTE" className="mb-6 max-w-[600px]">
        Keeps the Launcher,{" "}
        <ExternalLink href="https://github.com/SteamRE/DepotDownloader">
          DepotDownloader
        </ExternalLink>
        , <ExternalLink href="https://7-zip.org/">7z</ExternalLink>,{" "}
        <ExternalLink href="https://github.com/xeralin/ThrowbackLoader">
          ThrowbackLoader
        </ExternalLink>
        , and{" "}
        <ExternalLink href="https://github.com/DataCluster0/HeatedMetal">
          Heated Metal
        </ExternalLink>{" "}
        up to date.
      </Callout>

      <div className="flex max-w-[600px] flex-col gap-4">
        {update.components.map((component, index) => (
          <div
            key={component.name}
            className="rounded-lg border border-border bg-surface px-5 py-[0.85rem]"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="truncate font-display text-[1.05rem] font-bold text-text">
                  {component.name}
                </span>
                <VersionChip version={component.target} className="shrink-0" />
              </span>
              {update.applying === index && update.busy ? (
                <div
                  className={`${buttonBase} relative flex-shrink-0 cursor-not-allowed justify-center overflow-hidden bg-action-deep py-[0.55rem] text-action-text`}
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 origin-left bg-action transition-transform duration-200"
                    style={{ transform: `scaleX(${update.progress / 100})` }}
                  />
                  <span className="relative">Update</span>
                </div>
              ) : (
                <Button
                  variant="primary"
                  className="flex-shrink-0"
                  disabled={update.busy || update.checking || downloading}
                  onClick={() => update.apply(index)}
                >
                  Update
                </Button>
              )}
            </div>
            {component.notes.length > 0 && <Notes notes={component.notes} />}
          </div>
        ))}

        <div>
          <Button
            variant="secondary"
            disabled={update.checking || update.busy}
            onClick={() => {
              manualCheck.current = true;
              update.check(true);
            }}
          >
            Refresh
          </Button>
        </div>
      </div>
    </>
  );
}
