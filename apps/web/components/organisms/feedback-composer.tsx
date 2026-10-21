'use client';

import { cva } from 'class-variance-authority';
import { ChevronUpIcon, PenLineIcon } from 'lucide-react';
import { Suspense, use, useEffect, useId, useState } from 'react';
import { Button } from '@/components/atoms/button';
import { Skeleton } from '@/components/atoms/skeleton';
import type { GiveFeedbackAction } from '@/lib/feedback/give-feedback-state.type';
import type { RequestFeedbackAction } from '@/lib/feedback/request-feedback-state.type';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { preloadable } from '@/lib/preloadable.util';
import { whenIdle } from '@/lib/when-idle.util';
import type { GiveFeedbackFormProps } from './give-feedback-form';
import type { RequestFeedbackFormProps } from './request-feedback-form';

/*
 * The two forms carry the autocomplete and most of the composer's code, and a page needs neither
 * until someone opens a form, so they load apart from the page, fetched once the browser is idle.
 */
const loadRequestForm = preloadable(() => import('./request-feedback-form'));
const loadGiveForm = preloadable(() => import('./give-feedback-form'));

/** Fetches both forms ahead of need, as the composer does once the browser is idle. */
export function preloadComposerForms() {
  return Promise.all([loadRequestForm(), loadGiveForm()]);
}

function RequestFeedbackForm(props: RequestFeedbackFormProps) {
  const { RequestFeedbackForm: Form } = use(loadRequestForm());
  return <Form {...props} />;
}

function GiveFeedbackForm(props: GiveFeedbackFormProps) {
  const { GiveFeedbackForm: Form } = use(loadGiveForm());
  return <Form {...props} />;
}

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

  useEffect(
    () =>
      whenIdle(() => {
        void preloadComposerForms();
      }),
    [],
  );

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
            <Suspense fallback={<FormSkeleton />}>
              <RequestFeedbackForm
                teammates={teammates}
                workspaceGoals={workspaceGoals}
                action={requestAction}
              />
            </Suspense>
          </div>
        )}
        {drawn.has('give') && (
          <div hidden={mode !== 'give'}>
            <Suspense fallback={<FormSkeleton />}>
              <GiveFeedbackForm
                teammates={teammates}
                workspaceGoals={workspaceGoals}
                action={giveAction}
              />
            </Suspense>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * A form still loading: opened before the browser was idle long enough to fetch it. Each form
 * waits behind its own, so opening the second never hides the first.
 */
function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton shape="control" className="h-11 w-full rounded-input" />
      <Skeleton shape="control" className="h-24 w-full rounded-input" />
    </div>
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
