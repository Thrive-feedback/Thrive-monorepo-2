'use client';

import { cva } from 'class-variance-authority';
import { ChevronUpIcon, PenLineIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/atoms/button';
import { Skeleton } from '@/components/atoms/skeleton';
import type { GiveFeedbackAction } from '@/lib/feedback/give-feedback-state.type';
import type { RequestFeedbackAction } from '@/lib/feedback/request-feedback-state.type';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { GiveFeedbackForm } from './give-feedback-form';
import { RequestFeedbackForm } from './request-feedback-form';

type ComposerMode = 'request' | 'give';

const MODE_NAMES: Readonly<Record<ComposerMode, string>> = {
  request: 'Request feedback',
  give: 'Give feedback',
};

/** The two modes as an underlined pair, the open one marked, as tabs are elsewhere. */
const modeButton = cva(
  '-mb-px inline-flex cursor-pointer items-center whitespace-nowrap border-b-3 px-1 pb-2.5 text-button-sm',
  {
    variants: {
      pressed: {
        true: 'border-action-primary text-fg-primary',
        false: 'border-transparent text-fg-secondary hover:text-fg-primary',
      },
    },
  },
);

export type FeedbackComposerProps = {
  teammates: readonly Teammate[];
  /** The Workspace's active Workspace Goals, by name, offered on `#` as either form is written. */
  workspaceGoals: readonly string[];
  /** Sends a Feedback Request: Home's server action, or a stand-in. */
  requestAction: RequestFeedbackAction;
  /** Gives Feedback without being asked: Home's server action, or a stand-in. */
  giveAction: GiveFeedbackAction;
};

/**
 * One form, two modes: ask a teammate for Feedback, or give it without being asked — the two
 * moments `ADR-0022` holds equally important. The mode is not in the URL: it is a choice made
 * on the way to writing, not a place to come back to.
 *
 * It opens folded to one line, so a page someone came to read stays quiet: a prompt to ask for
 * advice, and Give feedback beside it. Either opens the form in its mode; Hide form folds it
 * again. A form is first drawn when its mode is first opened, since most visits only read and
 * Home draws the composer once per layout; from then on it stays mounted and is only hidden, so
 * folding or switching keeps what was typed.
 *
 * It draws its own box, so every page that offers it shows the same one.
 */
export function FeedbackComposer({
  teammates,
  workspaceGoals,
  requestAction,
  giveAction,
}: FeedbackComposerProps) {
  const [mode, setMode] = useState<ComposerMode>('request');
  const [expanded, setExpanded] = useState(false);
  const [drawn, setDrawn] = useState<ReadonlySet<ComposerMode>>(new Set());
  const formsId = useId();

  function choose(next: ComposerMode) {
    setMode(next);
    setDrawn((current) =>
      current.has(next) ? current : new Set([...current, next]),
    );
  }

  function open(next: ComposerMode) {
    choose(next);
    setExpanded(true);
  }

  return (
    <section
      aria-label="Ask for or give feedback"
      className="flex w-full flex-col rounded-page border border-border-muted bg-surface-base"
    >
      {expanded ? (
        <div className="flex items-center justify-between gap-4 border-border-subtle border-b px-5 pt-3">
          <fieldset className="flex min-w-0 items-end gap-5">
            <legend className="sr-only">Feedback form</legend>
            {(['request', 'give'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => choose(value)}
                className={modeButton({ pressed: mode === value })}
              >
                {MODE_NAMES[value]}
              </button>
            ))}
          </fieldset>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Hide form"
            aria-expanded
            aria-controls={formsId}
            onClick={() => setExpanded(false)}
            className="mb-2"
          >
            <ChevronUpIcon aria-hidden="true" className="size-5" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2">
          <button
            type="button"
            aria-expanded={false}
            aria-controls={formsId}
            onClick={() => open('request')}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-input px-3 py-2.5 text-left text-fg-secondary hover:bg-action-neutral-surface-hover"
          >
            <PenLineIcon aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate text-input-value-md">
              Ask for advice…
            </span>
          </button>
          <Button
            variant="secondary"
            size="sm"
            aria-expanded={false}
            aria-controls={formsId}
            onClick={() => open('give')}
          >
            {MODE_NAMES.give}
          </Button>
        </div>
      )}
      <div id={formsId} hidden={!expanded} className="p-5">
        {drawn.has('request') && (
          <div hidden={mode !== 'request'}>
            <RequestFeedbackForm
              teammates={teammates}
              workspaceGoals={workspaceGoals}
              action={requestAction}
            />
          </div>
        )}
        {drawn.has('give') && (
          <div hidden={mode !== 'give'}>
            <GiveFeedbackForm
              teammates={teammates}
              workspaceGoals={workspaceGoals}
              action={giveAction}
            />
          </div>
        )}
      </div>
    </section>
  );
}

/** A `FeedbackComposer` still loading, as it first opens: folded to its one line. */
export function FeedbackComposerSkeleton() {
  return (
    <div className="flex w-full items-center gap-2 rounded-page border border-border-muted p-2">
      <Skeleton shape="control" className="h-11 flex-1 rounded-input" />
      <Skeleton shape="control" className="h-9 w-28 rounded-button" />
    </div>
  );
}
