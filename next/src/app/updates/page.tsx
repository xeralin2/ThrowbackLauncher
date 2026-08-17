"use client";

import { useEffect, useRef } from "react";
import { Button, buttonBase } from "@/components/Button";
import { card } from "@/components/ui";
import { Note } from "@/components/Note";
import { ExternalLink } from "@/components/ExternalLink";
import { VersionChip } from "@/components/VersionChip";
import {
  useDownloaderRunning,
  useUpdate,
  type UpdateComponent,
} from "@/lib/bridge";
import { renderInline } from "@/lib/inline-markdown";
import { dismissToast, showToast } from "@/lib/toast";

const UPDATE_TOAST = "update";

type NoteEntry = UpdateComponent["notes"][number];
type NoteGroup = { text: string; children: string[] };
type Block =
  | { kind: "heading"; text: string }
  | { kind: "list"; ordered: boolean; items: NoteGroup[] };

function toBlocks(notes: NoteEntry[]): Block[] {
  const blocks: Block[] = [];
  for (const note of notes) {
    if (note.kind === "heading") {
      blocks.push({ kind: "heading", text: note.text });
      continue;
    }
    const ordered = note.kind === "number";
    const last = blocks[blocks.length - 1];
    if (last?.kind === "list" && last.ordered === ordered) {
      if (note.level > 0 && last.items.length > 0)
        last.items[last.items.length - 1].children.push(note.text);
      else last.items.push({ text: note.text, children: [] });
    } else {
      blocks.push({
        kind: "list",
        ordered,
        items: [{ text: note.text, children: [] }],
      });
    }
  }
  return blocks;
}

function NoteList({
  ordered,
  items,
}: {
  ordered: boolean;
  items: NoteGroup[];
}) {
  const List = ordered ? "ol" : "ul";
  return (
    <List
      className={`space-y-0.5 pl-4 text-ui text-text-muted ${
        ordered ? "list-decimal" : "list-disc"
      }`}
    >
      {items.map((note, index) => (
        <li key={index}>
          {renderInline(note.text)}
          {note.children.length > 0 && (
            <ul className="list-[circle] space-y-0.5 pl-4">
              {note.children.map((child, childIndex) => (
                <li key={childIndex}>{renderInline(child)}</li>
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
    <div className="flex flex-col gap-2">
      {toBlocks(notes).map((block, index) => {
        if (block.kind === "heading") {
          return (
            <div
              key={index}
              className="mt-1.5 font-display text-[0.9rem] font-bold text-text first:mt-0"
            >
              {renderInline(block.text)}
            </div>
          );
        }
        return (
          <NoteList key={index} ordered={block.ordered} items={block.items} />
        );
      })}
    </div>
  );
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
      if (update.checkError === "rate_limit") {
        showToast(
          "warning",
          update.checkErrorDetail ||
            "GitHub rate limit reached, try again later",
          {
            key: "rate-limit",
          },
        );
      } else if (update.checkError === "error") {
        showToast("warning", "Update check failed", {
          key: UPDATE_TOAST,
        });
      } else if (update.components.length > 0) {
        dismissToast(UPDATE_TOAST);
      } else if (wasManual) {
        showToast("success", "Everything is up to date", {
          key: UPDATE_TOAST,
        });
      }
    }
    wasChecking.current = update.checking;
  }, [update.checking, update.components.length, update.checkError]);

  return (
    <>
      <Note className="mb-6 max-w-[600px]">
        Keeps the Launcher,{" "}
        <ExternalLink href="https://github.com/SteamRE/DepotDownloader">
          DepotDownloader
        </ExternalLink>
        , <ExternalLink href="https://7-zip.org/">7z</ExternalLink>,{" "}
        <ExternalLink href="https://github.com/xeralin2/ThrowbackLoader">
          ThrowbackLoader
        </ExternalLink>
        , and{" "}
        <ExternalLink href="https://github.com/DataCluster0/HeatedMetal">
          Heated Metal
        </ExternalLink>{" "}
        up to date.
      </Note>

      <div className="flex max-w-[600px] flex-col gap-4">
        {update.components.map((component, index) => (
          <div key={component.name} className={card}>
            <div className="flex items-center justify-between gap-4">
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="truncate font-display text-[1.05rem] font-bold text-text">
                  {component.name}
                </span>
                <VersionChip version={component.target} className="shrink-0" />
              </span>
              {update.applying === index && update.busy ? (
                <button
                  type="button"
                  disabled
                  className={`${buttonBase} relative shrink-0 cursor-not-allowed justify-center overflow-hidden bg-[color-mix(in_srgb,var(--color-action)_45%,black)] text-action-text`}
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 origin-left bg-action transition-transform duration-200"
                    style={{ transform: `scaleX(${update.progress / 100})` }}
                  />
                  <span className="relative">Update</span>
                </button>
              ) : (
                <Button
                  variant="primary"
                  className="shrink-0"
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
