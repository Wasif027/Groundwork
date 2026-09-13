"use client";

import { useState } from "react";

import type { ChatMessage } from "@/lib/types";
import { copyToClipboard, formatMs } from "@/lib/utils";
import { toast } from "@/store/useToast";
import { useAppStore } from "@/store/useAppStore";
import { ArrowElbowDownRight, Check, Copy, GitCompare, Spinner, Warning } from "@/components/ui/icons";
import { AnalysisView } from "./AnalysisView";
import { AnswerText } from "./AnswerText";

export function AnswerCard({ message }: { message: ChatMessage }) {
  const highlightChunk = useAppStore((s) => s.highlightChunk);
  const ask = useAppStore((s) => s.ask);
  const streaming = useAppStore((s) => s.streaming);
  const compareDocIds = useAppStore((s) => s.compareDocIds);
  const setCompareDocs = useAppStore((s) => s.setCompareDocs);
  const [copied, setCopied] = useState(false);
  const answer = message.answer;

  const onCite = (marker: number) => {
    const c = answer?.citations.find((x) => x.marker === marker);
    if (c) highlightChunk(c.chunkId);
  };

  const askFollowUp = (f: string) => {
    // A compare-mode selection left over from a *different* question would
    // otherwise silently narrow this follow-up's scope to just those two
    // documents. Only keep it when this card's own answer was itself a
    // compare answer, where the selection is still the right context.
    if (!answer?.compareMode && compareDocIds.length) setCompareDocs([]);
    ask(f, {});
  };

  if (message.error) {
    return (
      <div role="alert" className="card border-danger/35 bg-danger/6 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-danger">
          <Warning className="h-4 w-4" weight="fill" /> Could not answer
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-content-secondary">{message.error}</p>
      </div>
    );
  }

  const skeleton = message.pending && !message.content;

  return (
    <div
      className="rounded-xl border border-line bg-surface-raised shadow-[0_1px_2px_rgb(var(--shadow)/0.04),0_18px_44px_-22px_rgb(var(--shadow)/0.16)]"
      style={{ padding: "calc(var(--space-scale, 1) * 1.25rem)" }}
    >
      {answer?.compareMode && (
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-md bg-accent-soft px-2 py-1 text-2xs font-medium text-accent">
          <GitCompare className="h-3 w-3" weight="fill" /> comparing documents
        </p>
      )}
      <div aria-live="polite" aria-atomic="false">
        {skeleton ? (
          <div className="space-y-2.5">
            <div className="skeleton h-3 w-2/3" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-11/12" />
            <div className="skeleton h-3 w-4/5" />
            <p className="flex items-center gap-1.5 pt-1 text-2xs text-content-muted">
              <Spinner className="h-3 w-3 animate-spin" /> retrieving &amp; reranking passages
            </p>
          </div>
        ) : (
          <AnswerText
            text={message.content}
            citations={answer?.citations ?? []}
            onCite={onCite}
            streaming={message.pending}
          />
        )}
      </div>

      {answer?.retrievalMode === "analysis" && answer.analysis && !message.pending && (
        <AnalysisView analysis={answer.analysis} />
      )}

      {answer && !message.pending && (
        <>
          {answer.insufficientEvidence && (
            <p className="mt-3.5 flex items-start gap-2 rounded-md border border-caution/25 bg-caution/8 p-2.5 text-2xs leading-relaxed text-caution">
              <Warning className="mt-px h-3 w-3 shrink-0" weight="fill" />
              Thin evidence in your documents — double-check this, or add a document that covers it.
            </p>
          )}

          {answer.followUps.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {answer.followUps.map((f) => (
                <button
                  key={f}
                  disabled={streaming}
                  onClick={() => askFollowUp(f)}
                  className="chip transition-[border-color,color] hover:border-accent/50 hover:text-accent disabled:opacity-50"
                >
                  <ArrowElbowDownRight className="h-3 w-3" />
                  {f}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-3 text-2xs text-content-muted">
            {answer.retrievalMode !== "meta" && (
              <>
                <span className="tnum">
                  {answer.citations.length} source{answer.citations.length === 1 ? "" : "s"}
                </span>
                <span aria-hidden>·</span>
              </>
            )}
            <span className="tnum">{formatMs(answer.latencyMs)}</span>
            {answer.cached && <span className="chip py-0.5">cached</span>}
            <button
              onClick={async () => {
                if (await copyToClipboard(toMarkdown(message))) {
                  setCopied(true);
                  toast.success("Copied as Markdown");
                  setTimeout(() => setCopied(false), 1400);
                }
              }}
              className="ml-auto flex items-center gap-1 transition-colors hover:text-content-primary"
            >
              {copied ? <Check className="h-3 w-3" weight="bold" /> : <Copy className="h-3 w-3" />}
              Copy
            </button>
          </div>
        </>
      )}

      {message.pending && message.content && (
        <p className="mt-2.5 flex items-center gap-1.5 text-2xs text-content-muted">
          <Spinner className="h-3 w-3 animate-spin" /> streaming
        </p>
      )}
    </div>
  );
}

function toMarkdown(m: ChatMessage): string {
  const a = m.answer;
  if (!a) return m.content;
  const cites = a.citations.map((c) => `[${c.marker}] ${c.title}${c.quote ? ` — "${c.quote}"` : ""}`).join("\n");
  return `**Q:** ${a.question}\n\n${a.answer}\n\n---\n**Sources**\n${cites}`;
}
