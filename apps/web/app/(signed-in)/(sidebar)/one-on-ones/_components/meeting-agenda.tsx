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
import { ChevronDownIcon, PlusIcon } from 'lucide-react';
import { useEffect, useId, useOptimistic, useRef, useState } from 'react';
import type { OneOnOneActionResult } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import { useOneOnOneAction } from '@/app/(signed-in)/(sidebar)/_lib/use-one-on-one-action';
import { usePrefersReducedMotion } from '@/app/(signed-in)/(sidebar)/_lib/use-prefers-reduced-motion';
import {
  type MeetingPeople,
  nameOf,
  type TopicOrigin,
  topicSourceOf,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/meeting-summary';
import { TopicText } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/topic-text';
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
import { useArrivals } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/use-arrivals';
import { useAutosave } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/use-autosave';
import { Button } from '@/components/atoms/button';
import { Checkbox } from '@/components/atoms/checkbox';
import { DragHandle } from '@/components/atoms/drag-handle';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Text } from '@/components/atoms/text';
import { Textarea } from '@/components/atoms/textarea';
import { RemoveButton } from '@/components/molecules/remove-button';
import { FEED_CARD_FILL } from '@/components/organisms/feed-card/feed-card-tone.constant';
import type { FeedCardTone } from '@/components/organisms/feed-card/feed-card-tone.type';
import { useIsSampleData } from '@/components/organisms/sample-data-provider';
import { cn } from '@/lib/cn.util';
import styles from './meeting-agenda.module.css';

const STATUS_WORDS = {
  idle: '',
  saving: 'Saving…',
  saved: 'Saved',
  failed: 'Not saved',
} as const;

/** Where an agenda topic came from: a previewed one, not open yet, has only its source and author. */
function originOf(item: AgendaTopic): TopicOrigin {
  return {
    source: item.source,
    authorAccountId: item.authorAccountId,
    broughtFrom: item.topic?.broughtFrom ?? null,
    templateKey: item.topic?.templateKey ?? null,
  };
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
        placeholder="What did you agree? You both see this."
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
  /** Just put on the agenda, by either person: it drops into its place, once. */
  isArriving: boolean;
  onArrived: () => void;
  /** Taken off: it slides aside and its gap closes, then `onLeft` sends the removal. */
  isLeaving: boolean;
  onLeft: () => void;
};

/**
 * How long after a removal starts it is sent even if its motion never says it ended: the motion
 * (`--motion-duration-very-slow`, 500ms) and a margin.
 */
const LEAVE_BACKSTOP_MS = 800;

/** A topic on its way off the agenda. */
type Leaving = {
  readonly key: string;
  readonly text: string;
};

function isSame(item: Leaving, other: Leaving): boolean {
  return item.key === other.key && item.text === other.text;
}

/** The first line of a note, to read beside a closed topic. */
function firstLineOf(notes: string): string {
  return (
    notes
      .split('\n')
      .find((line) => line.trim() !== '')
      ?.trim() ?? ''
  );
}

/** The voice a topic brought from Before you meet takes, as its card did: plum, orange or blue. */
const BROUGHT_TONE: Readonly<
  Record<NonNullable<MeetingTopic['broughtFrom']>['kind'], FeedCardTone>
> = {
  FEEDBACK: 'primary',
  KUDOS: 'secondary',
  ASK: 'tertiary',
};

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
  isArriving,
  onArrived,
  isLeaving,
  onLeft,
}: TopicRowProps) {
  const id = useId();
  const reducedMotion = usePrefersReducedMotion();
  const row = useRef<HTMLLIElement | null>(null);
  // Left once, whichever comes first: the end of its motion, or the backstop below.
  const hasLeft = useRef(false);
  const leave = useRef(onLeft);
  useEffect(() => {
    leave.current = onLeft;
  });
  // A tab in the background, or a browser that skips the motion, may never say it ended; the
  // removal is sent anyway, a little after the motion would have ended.
  useEffect(() => {
    if (!isLeaving) {
      hasLeft.current = false;
      return;
    }
    const backstop = setTimeout(() => {
      if (!hasLeft.current) {
        hasLeft.current = true;
        leave.current();
      }
    }, LEAVE_BACKSTOP_MS);
    return () => clearTimeout(backstop);
  }, [isLeaving]);
  const { topic } = item;
  const discussed = topic?.discussedAt != null;
  // Brought from Before you meet: its words wrap rather than cut off, after a dot in its kind's colour.
  const brought = topic?.broughtFrom?.kind ?? null;
  const dot = brought && (
    <span
      aria-hidden="true"
      className={cn(
        'me-2 inline-block size-2 rounded-full align-middle',
        FEED_CARD_FILL[BROUGHT_TONE[brought]],
      )}
    />
  );
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
      ref={(node) => {
        setNodeRef(node);
        row.current = node;
      }}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      // Out of reach while it goes, so nothing in it is pressed or read on its way out.
      inert={isLeaving}
      // Its own motion only, not one inside it that ends and bubbles up.
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }
        if (isLeaving) {
          if (!hasLeft.current) {
            hasLeft.current = true;
            onLeft();
          }
        } else if (isArriving) {
          onArrived();
        }
      }}
      className={cn(
        isArriving && !isLeaving && styles.dropIn,
        isLeaving && styles.leave,
        // Padded on every side, so a row lifted by its handle reads as a card with room around its
        // words; the list is pulled out by the same amount, so at rest the words line up as before.
        'relative flex flex-col border-border-subtle border-b bg-surface-base px-3 py-1.5 last:border-b-0',
        // The topic being talked about, its note open, edged in the product's colour, so where the
        // two are on the agenda is seen at a glance. Inside its edge, so it never touches a neighbour.
        isOpen &&
          'rounded-control border-transparent ring-1 ring-action-primary-border/30 ring-inset',
        isDragging && 'z-10 rounded-control border-transparent shadow-med',
      )}
    >
      <div className="flex min-h-10 items-center gap-2">
        <DragHandle
          ref={setActivatorNodeRef}
          data-agenda-grip
          aria-label={`Move ${item.text}`}
          disabled={isPending}
          {...attributes}
          {...listeners}
        />
        {inProgress && topic && (
          <Checkbox
            id={`${id}-discussed`}
            // Drawn at 16px; pressed anywhere in 24px around it.
            className="relative after:absolute after:-inset-1"
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
                'min-w-0 text-body-1',
                brought ? 'flex-1 break-words py-1' : 'truncate',
                // Talked about: struck through, as a list crosses off what is done.
                discussed
                  ? 'text-fg-secondary line-through decoration-fg-muted'
                  : 'text-fg-primary',
              )}
            >
              {dot}
              <TopicText text={item.text} />
            </span>
            <span
              className={cn(
                'min-w-0 truncate text-body-3 text-fg-muted',
                brought ? 'shrink-0' : 'flex-1',
              )}
            >
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
            <Text
              as="span"
              variant="body-1"
              className={cn(
                'min-w-0',
                brought ? 'flex-1 break-words py-1' : 'truncate',
              )}
            >
              {dot}
              <TopicText text={item.text} />
            </Text>
            <span
              className={cn(
                'min-w-0 truncate text-body-3 text-fg-muted',
                brought ? 'shrink-0' : 'flex-1',
              )}
            >
              {source}
            </span>
          </span>
        )}
        <div className="flex shrink-0 items-center">
          {mayRemove ? (
            <RemoveButton
              aria-label={`Remove: ${item.text}`}
              data-remove-for={item.key}
              disabled={isPending || isLeaving}
              onClick={() => {
                // The height it closes from, as it stands now: a row's height depends on its words.
                row.current?.style.setProperty(
                  '--row-height',
                  `${row.current.offsetHeight}px`,
                );
                onRemove();
              }}
            />
          ) : (
            // Where Remove would be, so every row's chevron stands in one column.
            <span aria-hidden="true" className="w-9 shrink-0" />
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
  /**
   * The template the reader last used here, by its key: the questions it asked are theirs to see
   * land, and are scrolled into view; another template's, used by the other person, are not.
   */
  templateUsed?: string | null;
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
  templateUsed = null,
}: MeetingAgendaProps) {
  const ids = useId();
  const { isPending, run } = useOneOnOneAction();
  const isSample = useIsSampleData();
  const [newTopic, setNewTopic] = useState('');
  const meeting = next.meeting;
  const inProgress = meeting?.state === 'IN_PROGRESS';
  const agenda = agendaOf(next);
  const [order, setOrder] = useOptimistic(agenda.map((item) => item.key));
  const items = order
    .map((key) => agenda.find((item) => item.key === key))
    .filter((item): item is AgendaTopic => item !== undefined);
  const arrivals = useArrivals(items);
  const reducedMotion = usePrefersReducedMotion();
  // Topics on their way off, by key and words: a previewed agenda numbers its keys, so once one goes
  // another takes its key, and the words tell the two apart. Each is let go once the agenda read
  // back no longer holds it, or when its removal was refused.
  const [leaving, setLeaving] = useState<readonly Leaving[]>([]);
  const stillLeaving = leaving.filter((each) =>
    items.some((item) => isSame(item, each)),
  );
  if (stillLeaving.length !== leaving.length) {
    setLeaving(stillLeaving);
  }
  const list = useRef<HTMLOListElement>(null);
  const addInput = useRef<HTMLInputElement>(null);
  const addForm = useRef<HTMLFormElement>(null);
  // What the reader puts on the agenda, from Before you meet far above it, typed, or from a template
  // they used, lands at its foot: the agenda is scrolled until Add a topic is in view, so what was
  // added is seen landing. Only as far as needed, never past it. What the other person added, brought
  // in by a Sync, does not move the page. Each topic is brought into view once: with less motion an
  // arrival is never marked done, and a reorder or a removal must not scroll again.
  const revealing = items
    .filter(
      (item) =>
        arrivals.isArriving(item.key) &&
        (item.source === 'TEMPLATE'
          ? templateUsed !== null && item.topic?.templateKey === templateUsed
          : item.authorAccountId === people.readerAccountId),
    )
    .map((item) => item.key)
    .join('\n');
  const revealed = useRef(new Set<string>());
  useEffect(() => {
    const fresh = revealing
      .split('\n')
      .filter((key) => key !== '' && !revealed.current.has(key));
    if (fresh.length === 0) {
      return;
    }
    for (const key of fresh) {
      revealed.current.add(key);
    }
    addForm.current?.scrollIntoView({
      block: 'nearest',
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [revealing, reducedMotion]);
  // Back on the Remove of a topic whose removal was refused: it went out of reach while it left, and
  // stays disabled until the page has read itself again, so focus waits for that.
  const [refocus, setRefocus] = useState<string | null>(null);
  useEffect(() => {
    if (refocus === null || isPending) {
      return;
    }
    list.current
      ?.querySelector<HTMLButtonElement>(
        `[data-remove-for="${globalThis.CSS.escape(refocus)}"]`,
      )
      ?.focus();
    setRefocus(null);
  }, [refocus, isPending]);
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

  /** Takes a topic off: it goes first, then the removal is sent; with less motion, at once. */
  function remove(item: AgendaTopic) {
    if (reducedMotion) {
      send(item);
      return;
    }
    setLeaving((each) => [...each, { key: item.key, text: item.text }]);
  }

  function send(item: AgendaTopic) {
    const position = order.indexOf(item.key);
    removedAt.current = position;
    run(
      () =>
        item.topic && meeting
          ? removeTopic(workspaceId, oneOnOneId, meeting.id, item.topic.id)
          : removePreviewTopic(workspaceId, oneOnOneId, position, item.text),
      {
        // Kept, it would move focus at the next change of the list, which nobody asked for. The
        // topic comes back into its place.
        onRefused: () => {
          removedAt.current = null;
          setLeaving((each) => each.filter((one) => !isSame(item, one)));
          setRefocus(item.key);
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
                  source={topicSourceOf(originOf(item), {
                    templates: next.templates,
                    templateName: next.templateName,
                    people,
                    carriedFrom: inProgress
                      ? null
                      : (next.carriedTopics.find(
                          (each) => each.topicId === item.topic?.id,
                        )?.from ?? null),
                  })}
                  // One topic leaves at a time: a second removal waits for the first, as the first
                  // may open the meeting and give every topic a new key.
                  isPending={isPending || leaving.length > 0}
                  people={people}
                  onRemove={() => remove(item)}
                  isOpen={inProgress && openKey === item.key}
                  onToggle={() =>
                    setChosenOpen(openKey === item.key ? null : item.key)
                  }
                  onConflict={() => setChosenOpen(item.key)}
                  isArriving={arrivals.isArriving(item.key)}
                  onArrived={() => arrivals.arrived(item.key)}
                  isLeaving={leaving.some((each) => isSame(item, each))}
                  onLeft={() => send(item)}
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
                    // Sample data, as in the showcase: a note is kept on the page, not sent.
                    isSample
                      ? Promise.resolve({
                          ok: false,
                          message: 'In the showcase, nothing is sent.',
                        })
                      : meeting
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
        ref={addForm}
        className="flex gap-2 scroll-mb-6"
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
