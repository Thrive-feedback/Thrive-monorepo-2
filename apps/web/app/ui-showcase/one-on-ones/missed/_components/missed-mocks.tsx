'use client';

import {
  EllipsisIcon,
  LayoutTemplateIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
} from 'lucide-react';
import type { MeetingView } from '@/app/ui-showcase/one-on-ones/missed/_lib/missed-meeting.model';
import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { DragHandle } from '@/components/atoms/drag-handle';
import { Input } from '@/components/atoms/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/atoms/tabs';
import { Text } from '@/components/atoms/text';
import { AvatarName } from '@/components/molecules/avatar-name';
import { RemoveButton } from '@/components/molecules/remove-button';
import { cn } from '@/lib/cn.util';

/*
 * The 1:1 as the page draws it on a given day. Drawn from the
 * panel's own frame, atoms and molecules, but nothing here acts: the simulator's buttons do.
 */

/** Pressing a drawn control does nothing; it is a picture of one. */
const DRAWN = { tabIndex: -1, 'aria-hidden': true } as const;

/** The 1:1's card in the list, as it reads that day, under the tab it is listed in. */
export function MockCard({ view }: { view: MeetingView }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Text as="p" variant="label" tone="muted">
        In {view.tab}
      </Text>
      <div className="flex items-center gap-3 rounded-control border border-action-primary-border bg-action-primary-surface px-3 py-2.5">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-content-center rounded-full bg-action-neutral-surface text-body-3 text-fg-secondary"
        >
          MB
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="flex flex-wrap items-center gap-2">
            <Text as="span" variant="subtitle-4">
              Mint Boonmee
            </Text>
            {view.card.badge && (
              <Badge tone={view.card.badge.tone}>{view.card.badge.label}</Badge>
            )}
          </span>
          <Text as="span" variant="body-3" tone="muted">
            {view.card.line}
          </Text>
        </div>
      </div>
    </div>
  );
}

/** The step at the top of Next meeting: where it stands, when, and what to press. */
function MockStep({ step }: { step: NonNullable<MeetingView['step']> }) {
  const isOverdue = step.word === 'Overdue';
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-control border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6',
        step.word === 'In progress'
          ? 'border-action-primary-border bg-action-primary/8'
          : isOverdue
            ? 'border-status-warning-border bg-status-warning-surface'
            : 'border-border-muted bg-surface-base',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Text as="p" variant="subtitle-3">
          <span
            className={cn(
              'font-medium',
              isOverdue ? 'text-status-warning-active' : 'text-fg-accent',
            )}
          >
            {step.word}
          </span>
          <span className="text-fg-muted"> · </span>
          {step.when}
        </Text>
        <Text as="p" variant="body-3" tone="muted" className="max-w-prose">
          {step.body}
        </Text>
      </div>
      <Button
        variant="primary"
        {...DRAWN}
        className="pointer-events-none"
        prefixIcon={
          step.action === 'Start meeting' ? (
            <PlayIcon aria-hidden="true" className="size-4" />
          ) : undefined
        }
      >
        {step.action}
      </Button>
    </div>
  );
}

/** The agenda: its head with Sync and Add from template, its topics, and Add a topic. */
function MockAgenda({ view }: { view: MeetingView }) {
  const inProgress = view.step?.word === 'In progress';
  const count = view.agenda.length;
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Text as="h4" variant="subtitle-4">
          Agenda{' '}
          <span className="font-normal text-body-3 text-fg-muted">
            {inProgress
              ? `0 of ${count} discussed`
              : `${count} ${count === 1 ? 'topic' : 'topics'}`}
          </span>
        </Text>
        <div className="pointer-events-none flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            {...DRAWN}
            prefixIcon={
              <RefreshCwIcon aria-hidden="true" className="size-3.5" />
            }
          >
            Sync
          </Button>
          {!inProgress && (
            <Button
              variant="ghost"
              size="sm"
              {...DRAWN}
              prefixIcon={
                <LayoutTemplateIcon aria-hidden="true" className="size-3.5" />
              }
            >
              Add from template
            </Button>
          )}
        </div>
      </div>
      {count === 0 ? (
        <Text as="p" variant="body-3" tone="muted">
          No topics yet. Add one, or add from a template.
        </Text>
      ) : (
        <ul aria-label="Agenda" className="-mx-3 flex flex-col">
          {view.agenda.map((topic) => (
            <li
              key={topic.id}
              className="pointer-events-none flex min-h-10 items-center gap-2 border-border-subtle border-b px-3 py-1.5 last:border-b-0"
            >
              {inProgress ? (
                <span
                  aria-hidden="true"
                  className="size-4 shrink-0 rounded-inner border border-border-strong"
                />
              ) : (
                <DragHandle aria-label={`Move ${topic.text}`} {...DRAWN} />
              )}
              <span className="flex min-w-0 flex-1 items-baseline gap-3 px-1">
                <Text as="span" variant="body-1" className="truncate">
                  {topic.text}
                </Text>
                <span className="min-w-0 flex-1 truncate text-body-3 text-fg-muted">
                  {topic.source}
                </span>
              </span>
              {!inProgress && (
                <RemoveButton aria-label={`Remove: ${topic.text}`} {...DRAWN} />
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="pointer-events-none flex gap-2">
        <Input
          {...DRAWN}
          readOnly
          placeholder="Add a topic"
          className="flex-1"
        />
        <Button
          variant="secondary"
          {...DRAWN}
          disabled
          prefixIcon={<PlusIcon aria-hidden="true" className="size-4" />}
        >
          Add
        </Button>
      </div>
    </section>
  );
}

/** Past meetings: held ones, and the days skipped, a run of them as one line. */
function MockPast({ rows }: { rows: MeetingView['past'] }) {
  if (rows.length === 0) {
    return (
      <Text as="p" variant="body-3" tone="muted">
        No past meetings yet. Each meeting you finish appears here for you both.
      </Text>
    );
  }
  return (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {rows.map((row) => (
        <li
          key={row.label}
          className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 py-3"
        >
          <Text
            as="span"
            variant="subtitle-4"
            tone={row.skipped ? 'muted' : 'default'}
          >
            {row.label}
          </Text>
          <Text
            as="span"
            variant="body-3"
            tone={row.skipped ? 'warning' : 'muted'}
          >
            {row.detail}
          </Text>
        </li>
      ))}
    </ul>
  );
}

/**
 * The open 1:1, whole: its head with the schedule's menu, then Next meeting and Past meetings in
 * tabs, as the panel draws them; in History, what became of it and its past meetings.
 */
export function MockPanel({ view }: { view: MeetingView }) {
  return (
    <section className="flex min-w-0 flex-col gap-6 rounded-page border border-border-muted bg-surface-base p-inset-card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <AvatarName name="Mint Boonmee" photoUrl={null} size="lg">
          <Text as="h3" variant="subtitle-2">
            Mint Boonmee
          </Text>
          <Text as="p" variant="body-3" tone="muted">
            {view.history ? view.history.line : view.schedule}
          </Text>
        </AvatarName>
        {!view.history && (
          <Button
            variant="ghost"
            size="icon"
            {...DRAWN}
            className="pointer-events-none"
          >
            <EllipsisIcon aria-hidden="true" className="size-4" />
          </Button>
        )}
      </div>
      {view.history ? (
        <div className="flex flex-col gap-4 border-border-subtle border-t pt-4">
          <Text as="p" variant="body-3" tone="muted">
            {view.history.note}
          </Text>
          <div className="flex flex-col gap-1">
            <Text as="h4" variant="subtitle-4">
              Past meetings
            </Text>
            <MockPast rows={view.past} />
          </div>
        </div>
      ) : (
        <Tabs
          defaultValue="next"
          className="border-border-subtle border-t pt-4"
        >
          <TabsList aria-label="Meetings">
            <TabsTrigger value="next">
              {view.step?.word === 'In progress'
                ? 'This meeting'
                : 'Next meeting'}
            </TabsTrigger>
            <TabsTrigger value="past" disabled={view.past.length === 0}>
              Past meetings
              {view.past.length > 0 && (
                <span className="text-fg-muted tabular-nums">
                  {view.past.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="next" className="flex flex-col gap-5">
            {view.step && <MockStep step={view.step} />}
            <MockAgenda view={view} />
          </TabsContent>
          <TabsContent value="past">
            <MockPast rows={view.past} />
          </TabsContent>
        </Tabs>
      )}
    </section>
  );
}

/** One day of the 1:1: its card in the list beside the whole of it, open. */
export function MockView({ view }: { view: MeetingView }) {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[16rem_1fr]">
      <MockCard view={view} />
      <MockPanel view={view} />
    </div>
  );
}
