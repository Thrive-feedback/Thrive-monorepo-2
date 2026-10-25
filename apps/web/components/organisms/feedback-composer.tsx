'use client';

import { cva } from 'class-variance-authority';
import { Suspense, use, useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/atoms/skeleton';
import { cn } from '@/lib/cn.util';
import type { GiveFeedbackAction } from '@/lib/feedback/give-feedback-state.type';
import type { GiveKudosAction } from '@/lib/feedback/give-kudos-state.type';
import type { RequestFeedbackAction } from '@/lib/feedback/request-feedback-state.type';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { preloadable } from '@/lib/preloadable.util';
import { whenIdle } from '@/lib/when-idle.util';
import { ComposerLayoutSkeleton } from './composer-layout';
import styles from './feedback-composer.module.css';
import type { GiveFeedbackFormProps } from './give-feedback-form';
import type { KudosFormProps } from './kudos-form';
import type { RequestFeedbackFormProps } from './request-feedback-form';

/*
 * The forms carry the autocomplete and most of the composer's code, and a page needs none of
 * them until someone opens a form, so they load apart from the page, fetched once the browser is
 * idle.
 */
const loadRequestForm = preloadable(() => import('./request-feedback-form'));
const loadGiveForm = preloadable(() => import('./give-feedback-form'));
const loadKudosForm = preloadable(() => import('./kudos-form'));

/** Fetches every form ahead of need, as the composer does once the browser is idle. */
export function preloadComposerForms() {
  return Promise.all([loadRequestForm(), loadGiveForm(), loadKudosForm()]);
}

function RequestFeedbackForm(props: RequestFeedbackFormProps) {
  const { RequestFeedbackForm: Form } = use(loadRequestForm());
  return <Form {...props} />;
}

function GiveFeedbackForm(props: GiveFeedbackFormProps) {
  const { GiveFeedbackForm: Form } = use(loadGiveForm());
  return <Form {...props} />;
}

function KudosForm(props: KudosFormProps) {
  const { KudosForm: Form } = use(loadKudosForm());
  return <Form {...props} />;
}

type ComposerMode = 'request' | 'give' | 'kudos';

const MODE_NAMES: Readonly<Record<ComposerMode, string>> = {
  request: 'Request feedback',
  give: 'Give feedback',
  kudos: 'Kudos',
};

/** Each mode by its first word, where the three names do not fit side by side. */
const SHORT_MODE_NAMES: Readonly<Record<ComposerMode, string>> = {
  request: 'Request',
  give: 'Give',
  kudos: 'Kudos',
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
  /** The Workspace's name, which the Kudos form names as its readers. */
  workspaceName?: string;
  /** Sends a Feedback Request: Home's server action, or a stand-in. */
  requestAction: RequestFeedbackAction;
  /** Gives Feedback without being asked: Home's server action, or a stand-in. */
  giveAction: GiveFeedbackAction;
  /** Gives Kudos. Without it there is no Kudos mode, as on the landing page's preview. */
  kudosAction?: GiveKudosAction;
};

/**
 * One form, two modes: ask a teammate for Feedback, or give it without being asked — the two
 * moments `ADR-0022` holds equally important — and, where Kudos can be sent, a third: Kudos, the
 * fastest way to give Feedback (brain `ADR-0043`). The mode is not in the URL: it is a choice made
 * on the way to writing, not a place to come back to.
 *
 * It is always open, ready to write, on asking for Feedback first: the form itself is the first
 * thing on Home. The other modes' forms are first drawn when they are first chosen; from then on
 * each stays mounted and is only hidden, so switching keeps what was typed.
 *
 * It draws its own box, so every page that offers it shows the same one.
 */
export function FeedbackComposer({
  teammates,
  workspaceGoals,
  workspaceName = 'your Workspace',
  requestAction,
  giveAction,
  kudosAction,
}: FeedbackComposerProps) {
  const modes: readonly ComposerMode[] = kudosAction
    ? ['request', 'give', 'kudos']
    : ['request', 'give'];
  const [mode, setMode] = useState<ComposerMode>('request');
  const [drawn, setDrawn] = useState<ReadonlySet<ComposerMode>>(
    new Set(['request']),
  );
  const modesRef = useRef<HTMLFieldSetElement>(null);

  useEffect(
    () =>
      whenIdle(() => {
        void preloadComposerForms();
      }),
    [],
  );

  // On a phone the modes scroll sideways, so the open one is brought into view when it opens.
  // Only the strip scrolls, never the page: the composer opens with the page, wherever it sits.
  useEffect(() => {
    const strip = modesRef.current;
    const open = strip?.querySelector(`[data-mode="${mode}"]`);
    if (!strip || !open) {
      return;
    }
    const stripBox = strip.getBoundingClientRect();
    const openBox = open.getBoundingClientRect();
    strip.scrollLeft +=
      openBox.left - stripBox.left - (stripBox.width - openBox.width) / 2;
  }, [mode]);

  function choose(next: ComposerMode) {
    setMode(next);
    setDrawn((current) =>
      current.has(next) ? current : new Set([...current, next]),
    );
  }

  return (
    <section
      aria-label="Ask for or give feedback"
      className="flex w-full flex-col rounded-page border border-border-muted bg-surface-base"
    >
      <div className="border-border-subtle border-b px-5 pt-3">
        <fieldset
          ref={modesRef}
          className={cn(
            'flex min-w-0 items-end gap-5 overflow-x-auto overflow-y-hidden',
            styles.modes,
          )}
        >
          <legend className="sr-only">Feedback form</legend>
          {modes.map((value) => (
            <button
              key={value}
              type="button"
              data-mode={value}
              aria-pressed={mode === value}
              aria-label={MODE_NAMES[value]}
              onClick={() => choose(value)}
              className={modeButton({ pressed: mode === value })}
            >
              {/* On a phone the three modes fit by their first word; the name stays whole. */}
              <span className="sm:hidden">{SHORT_MODE_NAMES[value]}</span>
              <span className="max-sm:hidden">{MODE_NAMES[value]}</span>
            </button>
          ))}
        </fieldset>
      </div>
      <div className="p-5">
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
        {kudosAction && drawn.has('kudos') && (
          <div hidden={mode !== 'kudos'}>
            <Suspense fallback={<FormSkeleton />}>
              <KudosForm
                teammates={teammates}
                workspaceGoals={workspaceGoals}
                workspaceName={workspaceName}
                action={kudosAction}
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
  return <ComposerLayoutSkeleton />;
}

/** A `FeedbackComposer` still loading, as it first opens: ready to write, on its first mode. */
export function FeedbackComposerSkeleton() {
  return (
    <div className="flex w-full flex-col rounded-page border border-border-muted">
      <div className="flex items-end gap-5 border-border-subtle border-b px-5 pt-3 pb-2.5">
        <Skeleton className="w-28 text-button-sm" />
        <Skeleton className="w-24 text-button-sm" />
        <Skeleton className="w-12 text-button-sm" />
      </div>
      <div className="p-5">
        <ComposerLayoutSkeleton />
      </div>
    </div>
  );
}
