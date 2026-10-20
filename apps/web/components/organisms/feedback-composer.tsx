'use client';

import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/atoms/button';
import { ButtonGroup } from '@/components/atoms/button-group';
import { Skeleton } from '@/components/atoms/skeleton';
import type { GiveFeedbackAction } from '@/lib/feedback/give-feedback-state.type';
import type { RequestFeedbackAction } from '@/lib/feedback/request-feedback-state.type';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { GiveFeedbackForm } from './give-feedback-form';
import {
  RequestFeedbackForm,
  RequestFeedbackFormSkeleton,
} from './request-feedback-form';

type ComposerMode = 'request' | 'give';

const MODE_NAMES: Readonly<Record<ComposerMode, string>> = {
  request: 'Request feedback',
  give: 'Give feedback',
};

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
 * on the way to writing, not a place to come back to. The two buttons are pressed one at a
 * time. Both forms stay mounted and the other one is hidden, so switching keeps what was typed.
 *
 * The forms fold away under the buttons for someone reading rather than writing; picking a mode
 * opens them again, since that is a step towards writing. It always opens expanded.
 *
 * It draws its own card, so every page that offers it shows the same one.
 */
export function FeedbackComposer({
  teammates,
  workspaceGoals,
  requestAction,
  giveAction,
}: FeedbackComposerProps) {
  const [mode, setMode] = useState<ComposerMode>('request');
  const [expanded, setExpanded] = useState(true);
  const formsId = useId();

  return (
    <section
      aria-label="Ask for or give feedback"
      className="flex w-full flex-col gap-4 rounded-page bg-surface-raised p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <ButtonGroup aria-label="Feedback form">
          {(['request', 'give'] as const).map((value) => (
            <Button
              key={value}
              variant={mode === value ? 'primary' : 'secondary'}
              size="sm"
              aria-pressed={mode === value}
              onClick={() => {
                setMode(value);
                setExpanded(true);
              }}
            >
              {MODE_NAMES[value]}
            </Button>
          ))}
        </ButtonGroup>
        <Button
          variant="ghost"
          size="icon"
          aria-label={expanded ? 'Hide form' : 'Show form'}
          aria-expanded={expanded}
          aria-controls={formsId}
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? (
            <ChevronUpIcon aria-hidden="true" className="size-5" />
          ) : (
            <ChevronDownIcon aria-hidden="true" className="size-5" />
          )}
        </Button>
      </div>
      <div id={formsId} hidden={!expanded}>
        <div hidden={mode !== 'request'}>
          <RequestFeedbackForm
            teammates={teammates}
            workspaceGoals={workspaceGoals}
            action={requestAction}
          />
        </div>
        <div hidden={mode !== 'give'}>
          <GiveFeedbackForm
            teammates={teammates}
            workspaceGoals={workspaceGoals}
            action={giveAction}
          />
        </div>
      </div>
    </section>
  );
}

/**
 * A `FeedbackComposer` still loading, as it first opens: the two mode buttons, the fold, and the
 * request form expanded.
 */
export function FeedbackComposerSkeleton() {
  return (
    <div className="flex w-full flex-col gap-4 rounded-page bg-surface-raised p-6">
      <div className="flex items-start justify-between gap-4">
        <Skeleton shape="control" className="h-9.5 w-64 rounded-button" />
        <Skeleton shape="circle" className="size-9" />
      </div>
      <RequestFeedbackFormSkeleton />
    </div>
  );
}
