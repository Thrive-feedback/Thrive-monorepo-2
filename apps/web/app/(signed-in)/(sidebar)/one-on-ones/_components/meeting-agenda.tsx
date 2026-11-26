'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDownIcon,
  GripVerticalIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useId, useOptimistic, useRef, useState } from 'react';
import type { OneOnOneActionResult } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import {
  type MeetingPeople,
  nameOf,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/meeting-summary';
import {
  type AgendaTopic,
  agendaOf,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-agenda.transform';
import type {
  MeetingTopic,
  NextMeeting,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';
import {
  addTopic,
  removePreviewTopic,
  removeTopic,
  reorderPreviewTopics,
  reorderTopics,
  updateTopic,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting-actions.service';
import { useAutosave } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/use-autosave';
import { useOneOnOneAction } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/use-one-on-one-action';
import { usePrefersReducedMotion } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/use-prefers-reduced-motion';
import { Button } from '@/components/atoms/button';
import { Checkbox } from '@/components/atoms/checkbox';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Text } from '@/components/atoms/text';
import { Textarea } from '@/components/atoms/textarea';
import { cn } from '@/lib/cn.util';

const STATUS_WORDS = {
  idle: '',
  saving: 'Saving…',
  saved: 'Saved',
  failed: 'Not saved',
} as const;

/** Where a topic came from, said quietly under it. */
function sourceOf(
  topic: AgendaTopic,
  templateName: string,
  people: MeetingPeople,
): string {
  switch (topic.source) {
    case 'CARRIED':
      return 'From last time';
    case 'TEMPLATE':
      return `From ${templateName}`;
    default:
      return `Added by ${nameOf(people, topic.authorAccountId)}`;
  }
}

type TopicNoteProps = {
  topic: MeetingTopic;
  people: MeetingPeople;
  save: (notes: string) => Promise<OneOnOneActionResult>;
  track?: (save: Promise<unknown>) => void;
  /** Told when the other person's words arrive beside unsaved ones, so the note is opened. */
  onConflict: () => void;
};

/**
 * The note both write on a topic while the meeting runs, saving itself. If the other person wrote it
 * while this one had unsaved words, both are shown, and nothing saves until the person chooses.
 */
function TopicNote({ topic, people, save, track, onConflict }: TopicNoteProps) {
  const id = useId();
  const note = useAutosave(topic.notes, save, {
    // The reader's own save read back is no conflict, only what the other person wrote.
    storedIsTheirs:
      topic.notesUpdatedByAccountId !== null &&
      topic.notesUpdatedByAccountId !== people.readerAccountId,
    track,
  });
  const writer = nameOf(people, topic.notesUpdatedByAccountId);
  const hasConflict = note.theirs !== null;
  const conflictSeen = useRef(onConflict);
  conflictSeen.current = onConflict;
  // A choice to make is never left in a closed topic.
  useEffect(() => {
    if (hasConflict) {
      conflictSeen.current();
    }
  }, [hasConflict]);
  return (
    // Under the topic's words from `sm`, past the handle and the tick; on a phone it takes the row's
    // full width to write in.
    <div className="flex flex-col gap-1 pt-1 sm:ps-14">
      <Label htmlFor={`${id}-note`} className="sr-only">
        Notes on {topic.text}
      </Label>
      <Textarea
        id={`${id}-note`}
        value={note.value}
        rows={2}
        placeholder="What did you say? Both of you read this."
        onChange={(event) => note.change(event.currentTarget.value)}
        onBlur={() => void note.flush()}
      />
      {note.theirs !== null ? (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-control bg-status-warning-surface px-3 py-2.5"
        >
          <Text as="p" variant="body-3">
            {writer} wrote this while you were typing:
          </Text>
          <Text
            as="p"
            variant="body-2"
            className="whitespace-pre-wrap border-action-secondary-border border-s ps-3"
          >
            {note.theirs === '' ? '(cleared the note)' : note.theirs}
          </Text>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={note.takeTheirs}>
              Use theirs
            </Button>
            <Button variant="ghost" size="sm" onClick={note.keepMine}>
              Keep mine
            </Button>
          </div>
        </div>
      ) : (
        <Text
          as="span"
          variant="caption"
          tone="muted"
          aria-live="polite"
          className="min-h-4"
        >
          {STATUS_WORDS[note.status]}
        </Text>
      )}
    </div>
  );
}

type TopicRowProps = {
  item: AgendaTopic;
  inProgress: boolean;
  mayRemove: boolean;
  source: string;
  isPending: boolean;
  people: MeetingPeople;
  onRemove: () => void;
  onDiscussed: (topic: MeetingTopic, discussed: boolean) => void;
  saveNote: (
    topic: MeetingTopic,
    notes: string,
  ) => Promise<OneOnOneActionResult>;
  track?: (save: Promise<unknown>) => void;
  /** Whether its note is the one open, while the meeting runs. */
  isOpen: boolean;
  onToggle: () => void;
  onConflict: () => void;
};

/** The first line of a note, to read beside a closed topic. */
function firstLineOf(notes: string): string {
  return (
    notes
      .split('\n')
      .find((line) => line.trim() !== '')
      ?.trim() ?? ''
  );
}

/**
 * One topic on the agenda, on one line, so a long agenda stays short: dragged by its handle into a
 * new place, before or during the meeting (with the keyboard, Space picks it up, the arrows move it
 * and Space puts it down), and removed by whoever may. Beside its words, quietly, where it came from.
 *
 * While the meeting runs it is ticked when talked about, and pressing its words opens its note under
 * it; one note is open at a time, and a closed topic shows its note's first line instead. Every note
 * stays on the page while closed, so what is typed keeps saving itself and nothing is lost.
 */
function TopicRow({
  item,
  inProgress,
  mayRemove,
  source,
  isPending,
  people,
  onRemove,
  onDiscussed,
  saveNote,
  track,
  isOpen,
  onToggle,
  onConflict,
}: TopicRowProps) {
  const id = useId();
  const reducedMotion = usePrefersReducedMotion();
  const { topic } = item;
  const discussed = topic?.discussedAt != null;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.key,
    disabled: isPending,
    // Rows still change places for someone who asked for less motion; they no longer slide there.
    transition: reducedMotion ? null : undefined,
  });
  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={cn(
        // Padded on every side, so a row lifted by its handle reads as a card with room around its
        // words; the list is pulled out by the same amount, so at rest the words line up as before.
        'relative flex flex-col border-border-subtle border-b bg-surface-base px-3 py-1.5 last:border-b-0',
        isDragging && 'z-10 rounded-control border-transparent shadow-med',
      )}
    >
      <div className="flex min-h-10 items-center gap-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          data-agenda-grip
          aria-label={`Move ${item.text}`}
          // The icon stays 24px; an invisible ring around it makes the handle 40 by 44 for a finger,
          // reaching into the row's padding and the gap beside it, never over the next control.
          className="relative grid size-6 shrink-0 cursor-grab touch-none place-content-center rounded-element before:absolute before:-inset-x-2 before:-inset-y-2.5 text-fg-muted transition-colors duration-quick ease-smooth-out hover:bg-action-neutral-surface-hover hover:text-fg-secondary focus-visible:outline-2 focus-visible:outline-action-primary active:cursor-grabbing disabled:cursor-not-allowed"
          disabled={isPending}
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon aria-hidden="true" className="size-4" />
        </button>
        {inProgress && topic && (
          <Checkbox
            id={`${id}-discussed`}
            checked={discussed}
            disabled={isPending}
            onCheckedChange={(checked) => onDiscussed(topic, checked === true)}
            aria-label={`Discussed: ${item.text}`}
          />
        )}
        {inProgress && topic ? (
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={`${id}-note-panel`}
            onClick={onToggle}
            className="flex min-w-0 flex-1 items-center gap-3 self-stretch rounded-element px-1 text-start transition-colors duration-quick ease-smooth-out hover:bg-action-neutral-surface-hover focus-visible:outline-2 focus-visible:outline-action-primary"
          >
            <span
              className={cn(
                'min-w-0 truncate text-body-1',
                // Talked about: struck through, as a list crosses off what is done.
                discussed
                  ? 'text-fg-secondary line-through decoration-fg-muted'
                  : 'text-fg-primary',
              )}
            >
              {item.text}
            </span>
            <span className="min-w-0 flex-1 truncate text-body-3 text-fg-muted">
              {isOpen ? source : firstLineOf(topic.notes) || source}
            </span>
            <ChevronDownIcon
              aria-hidden="true"
              className={cn(
                'size-4 shrink-0 text-fg-muted transition-transform duration-quick ease-smooth-out motion-reduce:transition-none',
                isOpen && 'rotate-180',
              )}
            />
          </button>
        ) : (
          <span className="flex min-w-0 flex-1 items-baseline gap-3 px-1">
            <Text as="span" variant="body-1" className="min-w-0 truncate">
              {item.text}
            </Text>
            <span className="min-w-0 flex-1 truncate text-body-3 text-fg-muted">
              {source}
            </span>
          </span>
        )}
        <div className="flex shrink-0 items-center">
          {mayRemove ? (
            <Button
              variant="ghost-danger"
              size="sm"
              aria-label={`Remove: ${item.text}`}
              disabled={isPending}
              onClick={onRemove}
            >
              <XIcon aria-hidden="true" className="size-4" />
            </Button>
          ) : (
            // Where Remove would be, so every row's chevron stands in one column.
            <span aria-hidden="true" className="w-10 shrink-0" />
          )}
        </div>
      </div>
      {inProgress && topic && (
        <div id={`${id}-note-panel`} hidden={!isOpen} className="pb-2">
          <TopicNote
            topic={topic}
            people={people}
            save={(notes) => saveNote(topic, notes)}
            track={track}
            onConflict={onConflict}
          />
        </div>
      )}
    </li>
  );
}

export type MeetingAgendaProps = {
  workspaceId: string;
  oneOnOneId: string;
  next: NextMeeting;
  people: MeetingPeople;
  /** Its heading's id, which names the list. */
  headingId: string;
  /** Told of each note saved, so Finish can wait for them to land. */
  track?: (save: Promise<unknown>) => void;
};

/**
 * The next meeting's agenda: reordered by dragging, before or during the meeting; topics removed by
 * whoever may; a topic added at the end. Before anybody writes, it is what the meeting will open
 * with, and the first change opens it with those topics, then makes the change — refused, rather than
 * landing on another topic, if the other person changed the agenda meanwhile.
 *
 * A new order shows at once and is saved behind it; refused, the order goes back. When the topic
 * that had focus is removed, focus moves to the next one, or to Add a topic.
 */
export function MeetingAgenda({
  workspaceId,
  oneOnOneId,
  next,
  people,
  headingId,
  track,
}: MeetingAgendaProps) {
  const ids = useId();
  const { isPending, run } = useOneOnOneAction();
  const [newTopic, setNewTopic] = useState('');
  const meeting = next.meeting;
  const inProgress = meeting?.state === 'IN_PROGRESS';
  const agenda = agendaOf(next);
  const [order, setOrder] = useOptimistic(agenda.map((item) => item.key));
  const items = order
    .map((key) => agenda.find((item) => item.key === key))
    .filter((item): item is AgendaTopic => item !== undefined);
  const list = useRef<HTMLOListElement>(null);
  const addInput = useRef<HTMLInputElement>(null);
  // The topic whose note is open while the meeting runs; until somebody chooses, the first one not
  // talked about yet, so starting the meeting puts the person at the first topic to discuss.
  const [chosenOpen, setChosenOpen] = useState<string | null | undefined>(
    undefined,
  );
  const [wasInProgress, setWasInProgress] = useState(inProgress);
  if (wasInProgress !== inProgress) {
    setWasInProgress(inProgress);
    setChosenOpen(undefined);
  }
  const firstUndiscussed = items.find(
    (item) => item.topic && item.topic.discussedAt === null,
  )?.key;
  const openKey =
    chosenOpen === undefined ? (firstUndiscussed ?? null) : chosenOpen;

  /** The next topic after `key` not talked about yet, or `null` when none is left. */
  function nextUndiscussedAfter(key: string): string | null {
    const at = items.findIndex((item) => item.key === key);
    return (
      items
        .slice(at + 1)
        .find((item) => item.topic && item.topic.discussedAt === null)?.key ??
      null
    );
  }
  const removedAt = useRef<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // A removed row takes its focus with it; give it to the row that took its place.
  const count = items.length;
  useEffect(() => {
    const at = removedAt.current;
    if (at === null) {
      return;
    }
    const active = document.activeElement;
    if (active !== null && active !== document.body) {
      return;
    }
    removedAt.current = null;
    const grips =
      list.current?.querySelectorAll<HTMLButtonElement>('[data-agenda-grip]');
    const target = count > 0 ? grips?.[Math.min(at, count - 1)] : undefined;
    (target ?? addInput.current)?.focus();
  }, [count]);

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) {
      return;
    }
    const from = order.indexOf(String(active.id));
    const to = order.indexOf(String(over.id));
    const moved = arrayMove(order, from, to);
    const seen = items.map((item) => item.text);
    run(async () => {
      setOrder(moved);
      return meeting
        ? reorderTopics(workspaceId, oneOnOneId, meeting.id, moved)
        : reorderPreviewTopics(workspaceId, oneOnOneId, seen, from, to);
    });
  }

  function remove(item: AgendaTopic) {
    const position = order.indexOf(item.key);
    removedAt.current = position;
    run(
      () =>
        item.topic && meeting
          ? removeTopic(workspaceId, oneOnOneId, meeting.id, item.topic.id)
          : removePreviewTopic(workspaceId, oneOnOneId, position, item.text),
      {
        // Kept, it would move focus at the next change of the list, which nobody asked for.
        onRefused: () => {
          removedAt.current = null;
        },
      },
    );
  }

  function add() {
    const text = newTopic.trim();
    if (text === '') {
      return;
    }
    run(() => addTopic(workspaceId, oneOnOneId, meeting?.id ?? null, text), {
      onSuccess: () => setNewTopic(''),
    });
  }

  return (
    <>
      {items.length > 0 && (
        <DndContext
          // A stable id, so the server and the browser name its live region alike.
          id={`${ids}-agenda-dnd`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          accessibility={{
            screenReaderInstructions: {
              draggable:
                'To move a topic, press Space, use the arrow keys, then press Space to drop it, or Escape to cancel.',
            },
          }}
        >
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <ol
              ref={list}
              aria-labelledby={headingId}
              className="-mx-3 flex flex-col"
            >
              {items.map((item) => (
                <TopicRow
                  key={item.key}
                  item={item}
                  inProgress={inProgress}
                  mayRemove={
                    item.source !== 'PERSON' ||
                    item.authorAccountId === people.readerAccountId
                  }
                  source={sourceOf(item, next.templateName, people)}
                  isPending={isPending}
                  people={people}
                  onRemove={() => remove(item)}
                  isOpen={inProgress && openKey === item.key}
                  onToggle={() =>
                    setChosenOpen(openKey === item.key ? null : item.key)
                  }
                  onConflict={() => setChosenOpen(item.key)}
                  onDiscussed={(topic, discussed) => {
                    // Ticking the open topic moves on to the next one to talk about.
                    if (discussed && openKey === item.key) {
                      setChosenOpen(nextUndiscussedAfter(item.key));
                    }
                    if (meeting) {
                      run(() =>
                        updateTopic(
                          workspaceId,
                          oneOnOneId,
                          meeting.id,
                          topic.id,
                          { discussed },
                        ),
                      );
                    }
                  }}
                  track={track}
                  saveNote={(topic, notes) =>
                    meeting
                      ? updateTopic(
                          workspaceId,
                          oneOnOneId,
                          meeting.id,
                          topic.id,
                          { note: notes, noteReadAt: topic.notesUpdatedAt },
                        )
                      : Promise.resolve({
                          ok: false,
                          message: 'Start the meeting to take notes in it.',
                        })
                  }
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
      >
        <Label htmlFor={`${ids}-topic`} className="sr-only">
          Add a topic
        </Label>
        <Input
          ref={addInput}
          id={`${ids}-topic`}
          value={newTopic}
          maxLength={200}
          placeholder="Add a topic"
          disabled={isPending}
          onChange={(event) => setNewTopic(event.currentTarget.value)}
          className="flex-1"
        />
        <Button
          type="submit"
          variant="secondary"
          disabled={isPending || newTopic.trim() === ''}
          prefixIcon={<PlusIcon aria-hidden="true" className="size-4" />}
        >
          Add
        </Button>
      </form>
    </>
  );
}
