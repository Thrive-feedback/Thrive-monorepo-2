'use client';

import { cva } from 'class-variance-authority';
import { LockIcon, Rotate3dIcon, ShuffleIcon, StampIcon } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { toast } from 'sonner';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { SELECTED_PEOPLE } from '@/components/organisms/visibility-picker';
import { cn } from '@/lib/cn.util';
import { MENTION_RULE } from '@/lib/feedback/text-tag-rules.constant';
import { segmentsOf, tagKeyOf } from '@/lib/tag-text.util';
import { KudosCard } from './kudos-card';
import { KUDOS_STYLES } from './kudos-styles.constant';
import styles from './letter.module.css';
import { LetterBody } from './letter-body';
import { LetterFace, type LetterSide } from './letter-face';
import { LetterSendBar, type LetterVisibility } from './letter-send-bar';
import { LetterSidebar, type WritingKind } from './letter-sidebar';
import { LetterStamp, type PlacedStamp } from './letter-stamp';
import type { StampKind } from './letter-stamp-kinds.constant';
import { LetterStampPanel } from './letter-stamp-panel';
import { LETTER_TEAMMATES } from './letter-teammates.mock';

const SIDE_COPY: Readonly<
  Record<
    LetterSide,
    { title: string; messageLabel: string; placeholder: string }
  >
> = {
  give: {
    title: 'Give message',
    messageLabel: 'Your feedback',
    placeholder: 'What did you notice, while it still matters?',
  },
  request: {
    title: 'Request message',
    messageLabel: 'What you would like feedback on',
    placeholder: 'What would you like their feedback on?',
  },
};

const OTHER_SIDE: Readonly<Record<LetterSide, LetterSide>> = {
  give: 'request',
  request: 'give',
};

const SIDES = ['give', 'request'] as const;

type Letter = {
  recipient: string;
  message: string;
  visibility: LetterVisibility;
  selectedAccountIds: ReadonlySet<string>;
};

const BLANK: Letter = {
  recipient: '',
  message: '',
  visibility: 'ONLY_ME',
  selectedAccountIds: new Set(),
};

/** Where a stamp lands: the top right corner, where a stamp goes on an envelope. */
const STAMP_CORNER = { x: 90, y: 12 };

/** Each face starts with one stamp of its own. */
const FIRST_STAMPS: Readonly<Record<LetterSide, readonly PlacedStamp[]>> = {
  give: [
    { id: 'give-first', kind: 'heart', ...STAMP_CORNER, scale: 1, rotation: 4 },
  ],
  request: [
    {
      id: 'request-first',
      kind: 'question',
      ...STAMP_CORNER,
      scale: 1,
      rotation: 4,
    },
  ],
};

function isReady(letter: Letter) {
  return (
    letter.recipient.trim() !== '' &&
    letter.message.trim() !== '' &&
    (letter.visibility !== SELECTED_PEOPLE ||
      letter.selectedAccountIds.size > 0)
  );
}

const TEAMMATE_KEYS = new Set(
  LETTER_TEAMMATES.flatMap(({ slug }) =>
    slug === null ? [] : [tagKeyOf(slug)],
  ),
);

/** A Kudos is for whoever it @mentions, so it is ready once it names a teammate. */
function namesTeammate(message: string) {
  return segmentsOf(message, [MENTION_RULE]).some(
    (segment) => segment.kind === 'tag' && TEAMMATE_KEYS.has(segment.key),
  );
}

const stage = cva(styles.stage, {
  variants: {
    motion: {
      still: '',
      shaking: styles.shake,
      sending: styles.sendAway,
    },
  },
});

// Over a Kudos card the toolbar narrows to the card, so Style sits at its top right corner.
const toolbar = cva('mx-auto flex w-full justify-end gap-3', {
  variants: {
    kudos: { true: 'max-w-72', false: 'max-w-2xl' },
  },
});

const sheet = cva('grid', {
  variants: {
    side: {
      give: styles.sheet,
      request: cn(styles.sheet, styles.turned),
    },
  },
});

/**
 * Feedback as a letter, as a first look: one sheet with a Give message on the front and a
 * Request message on the back. The sidebar offers the kinds of letter; choosing Give feedback or
 * Request feedback turns the sheet to that face and opens it for writing. Each face keeps its own
 * letter. Nothing is sent or kept: what is typed lives until the page is left.
 *
 * Kudos is not a letter. Choosing it puts a small upright card where the sheet was, with nothing
 * to turn and no stamps: Style steps the card through its three looks, and the message names who
 * it is for with an @Mention. Send waits for one.
 *
 * Only the letter being written can be typed in. While it is the Give message the sheet will not
 * turn over: Turn over shakes it instead. While it is the Request message the sheet turns
 * freely, and the front says it is for the people being asked, who write their feedback there.
 *
 * Under the letter being written floats who else can read it and Send. Sending only pretends:
 * the letter leaves the page, a toast says it went, and that side is blank again.
 *
 * Stamps can be added from the Stamps drawer on the right, which opens only from its button; a
 * new one lands in the top right corner of the face being shown. A selected
 * stamp can be moved, resized, turned and taken off; clicking anywhere else lets it go.
 */
export function LetterDemo() {
  const [side, setSide] = useState<LetterSide>('give');
  const [writing, setWriting] = useState<WritingKind | null>(null);
  const [motion, setMotion] = useState<'still' | 'shaking' | 'sending'>(
    'still',
  );
  const stageRef = useRef<HTMLDivElement>(null);
  const [letters, setLetters] = useState<Record<LetterSide, Letter>>({
    give: BLANK,
    request: BLANK,
  });
  const recipientRefs = {
    give: useRef<HTMLInputElement>(null),
    request: useRef<HTMLInputElement>(null),
  };
  const messageRefs = {
    give: useRef<HTMLTextAreaElement>(null),
    request: useRef<HTMLTextAreaElement>(null),
  };
  const [stamps, setStamps] =
    useState<Record<LetterSide, readonly PlacedStamp[]>>(FIRST_STAMPS);
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);
  const [stampPanelOpen, setStampPanelOpen] = useState(false);
  const stampCount = useRef(0);
  const stampPanelId = useId();
  const stampsButtonRef = useRef<HTMLButtonElement>(null);
  const [kudos, setKudos] = useState('');
  const [kudosStyle, setKudosStyle] = useState(0);
  const kudosRef = useRef<HTMLTextAreaElement>(null);
  const writingKudos = writing === 'kudos';
  const nextKudosStyle = (kudosStyle + 1) % KUDOS_STYLES.length;
  // Both indexes stay inside the list; the fallback only satisfies the index check.
  const shownKudosStyle = KUDOS_STYLES[kudosStyle] ?? KUDOS_STYLES[0];
  const nextKudosStyleName = (KUDOS_STYLES[nextKudosStyle] ?? KUDOS_STYLES[0])
    .label;
  const otherSide = OTHER_SIDE[side];
  const turnLocked = writing === 'give';
  const stampsHere = !writingKudos && takesStamps(side);
  const stampDrawerOpen = stampPanelOpen && stampsHere;

  // The Give side of a Request message is left for the people asked, so nothing is stuck on it.
  function takesStamps(letterSide: LetterSide) {
    return !(writing === 'request' && letterSide === 'give');
  }

  // A selected stamp is let go by a press anywhere but on a stamp or the Stamps drawer.
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Element &&
        event.target.closest('[data-stamp], [data-stamp-panel]')
      ) {
        return;
      }
      setSelectedStampId(null);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  function changeStamps(
    letterSide: LetterSide,
    update: (current: readonly PlacedStamp[]) => readonly PlacedStamp[],
  ) {
    setStamps((current) => ({
      ...current,
      [letterSide]: update(current[letterSide]),
    }));
  }

  function handleAddStamp(kind: StampKind) {
    stampCount.current += 1;
    const id = `stamp-${stampCount.current}`;
    changeStamps(side, (current) => [
      ...current,
      { id, kind, ...STAMP_CORNER, scale: 1, rotation: 4 },
    ]);
    setSelectedStampId(id);
  }

  // Opened, the drawer takes focus to its first stamp; closed, focus goes back to its button.
  function handleToggleStamps() {
    if (stampDrawerOpen) {
      setStampPanelOpen(false);
      return;
    }
    flushSync(() => setStampPanelOpen(true));
    document
      .getElementById(stampPanelId)
      ?.querySelector<HTMLButtonElement>('ul button')
      ?.focus();
  }

  function handleCloseStamps() {
    setStampPanelOpen(false);
    stampsButtonRef.current?.focus();
  }

  function changeLetter(letterSide: LetterSide, change: Partial<Letter>) {
    setLetters((current) => ({
      ...current,
      [letterSide]: { ...current[letterSide], ...change },
    }));
  }

  // What is chosen is drawn at once, so its writing can take focus straight away: on a letter,
  // who it is for first, or the message if that is already filled in.
  function handleChoose(kind: WritingKind) {
    if (kind === 'kudos') {
      flushSync(() => setWriting(kind));
      kudosRef.current?.focus();
      return;
    }
    const letterSide = kind;
    flushSync(() => {
      setSide(letterSide);
      setWriting(letterSide);
    });
    const field =
      letters[letterSide].recipient === ''
        ? recipientRefs[letterSide]
        : messageRefs[letterSide];
    field.current?.focus();
  }

  function handleTurnOver() {
    if (turnLocked) {
      setMotion('shaking');
      return;
    }
    setSide(otherSide);
  }

  // The letter flies off before it is cleared. With reduced motion there is nothing to wait for,
  // so it is cleared at once.
  function handleSend() {
    flushSync(() => setMotion('sending'));
    if ((stageRef.current?.getAnimations?.() ?? []).length === 0) {
      finishSending();
    }
  }

  function finishSending() {
    if (writing === null) {
      return;
    }
    // A Kudos keeps the look it was sent in, ready for the next one.
    if (writing === 'kudos') {
      flushSync(() => {
        setKudos('');
        setMotion('still');
      });
      toast.success('Kudos sent.', {
        description: 'This is a demo: nothing left this page.',
      });
      kudosRef.current?.focus();
      return;
    }
    const sentSide = writing;
    flushSync(() => {
      changeLetter(sentSide, BLANK);
      changeStamps(sentSide, () => FIRST_STAMPS[sentSide]);
      setMotion('still');
    });
    toast.success(`${SIDE_COPY[sentSide].title} sent.`, {
      description: 'This is a demo: nothing left this page.',
    });
    recipientRefs[sentSide].current?.focus();
  }

  function handleStageAnimationEnd(event: React.AnimationEvent) {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (motion === 'sending') {
      finishSending();
    } else {
      setMotion('still');
    }
  }

  function renderFaceContent(letterSide: LetterSide) {
    if (writing === letterSide) {
      const letter = letters[letterSide];
      const copy = SIDE_COPY[letterSide];
      return (
        <LetterBody
          recipient={letter.recipient}
          message={letter.message}
          messageLabel={copy.messageLabel}
          placeholder={copy.placeholder}
          recipientRef={recipientRefs[letterSide]}
          messageRef={messageRefs[letterSide]}
          onRecipientChange={(recipient) =>
            changeLetter(letterSide, { recipient })
          }
          onMessageChange={(message) => changeLetter(letterSide, { message })}
        />
      );
    }
    if (!takesStamps(letterSide)) {
      return (
        <div
          className={cn(
            'flex flex-1 items-center justify-center px-4',
            styles.ruled,
          )}
        >
          <Text
            variant="subtitle-handwrite-2"
            tone="muted"
            className="max-w-xs text-center"
          >
            This side is for the people you request feedback from. They write
            their answer here.
          </Text>
        </div>
      );
    }
    return <div className={cn('flex-1', styles.ruled)} />;
  }

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start">
      <div className="md:sticky md:top-6 md:w-56 md:shrink-0">
        <LetterSidebar writing={writing} onChoose={handleChoose} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className={toolbar({ kudos: writingKudos })}>
          {writingKudos ? (
            <Button
              variant="secondary"
              prefixIcon={<ShuffleIcon />}
              onClick={() => setKudosStyle(nextKudosStyle)}
            >
              <span className="tabular-nums">
                Style {kudosStyle + 1}/{KUDOS_STYLES.length}
              </span>
              <span className="sr-only">
                {' '}
                to change to {nextKudosStyleName}
              </span>
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                prefixIcon={<StampIcon />}
                aria-expanded={stampDrawerOpen}
                aria-controls={stampDrawerOpen ? stampPanelId : undefined}
                disabled={!stampsHere}
                ref={stampsButtonRef}
                onClick={handleToggleStamps}
              >
                Stamps
              </Button>
              <Button
                variant="secondary"
                prefixIcon={turnLocked ? <LockIcon /> : <Rotate3dIcon />}
                aria-disabled={turnLocked}
                onClick={handleTurnOver}
              >
                Turn over
                <span className="sr-only">
                  {' '}
                  to {SIDE_COPY[otherSide].title}
                </span>
              </Button>
            </>
          )}
        </div>
        <p aria-live="polite" className="sr-only">
          {writingKudos &&
            `Style ${kudosStyle + 1} of ${KUDOS_STYLES.length}: ${shownKudosStyle.label}`}
          {turnLocked && 'The letter stays on Give message while you write it.'}
        </p>

        <div
          ref={stageRef}
          className={cn('mx-auto w-full max-w-2xl', stage({ motion }))}
          onAnimationEnd={handleStageAnimationEnd}
        >
          {writingKudos ? (
            <div className="flex justify-center">
              <KudosCard
                style={shownKudosStyle.style}
                message={kudos}
                messageRef={kudosRef}
                onMessageChange={setKudos}
              />
            </div>
          ) : (
            <div className={sheet({ side })}>
              {SIDES.map((letterSide) => (
                <LetterFace
                  key={letterSide}
                  side={letterSide}
                  title={SIDE_COPY[letterSide].title}
                  shown={side === letterSide}
                >
                  {renderFaceContent(letterSide)}
                  {takesStamps(letterSide) &&
                    stamps[letterSide].map((stamp) => (
                      <LetterStamp
                        key={stamp.id}
                        stamp={stamp}
                        side={letterSide}
                        selected={selectedStampId === stamp.id}
                        onSelect={() => setSelectedStampId(stamp.id)}
                        onChange={(change) =>
                          changeStamps(letterSide, (current) =>
                            current.map((each) =>
                              each.id === stamp.id
                                ? { ...each, ...change }
                                : each,
                            ),
                          )
                        }
                        onDelete={() =>
                          changeStamps(letterSide, (current) =>
                            current.filter((each) => each.id !== stamp.id),
                          )
                        }
                      />
                    ))}
                </LetterFace>
              ))}
            </div>
          )}
        </div>
        {/* Under what is being written, a letter on either face or the Kudos card. It sticks to
            the foot of the window while the letter runs past it; only the bar itself takes
            clicks, so the writing either side of it stays reachable. A Kudos has no Visibility
            to choose. */}
        {writing !== null && (
          <div className="pointer-events-none sticky bottom-6 z-20 flex justify-center *:pointer-events-auto">
            {writing === 'kudos' ? (
              <LetterSendBar
                ready={motion === 'still' && namesTeammate(kudos)}
                onSend={handleSend}
              />
            ) : (
              <LetterSendBar
                visibility={{
                  side: writing,
                  value: letters[writing].visibility,
                  selectedAccountIds: letters[writing].selectedAccountIds,
                  onValueChange: (visibility) =>
                    changeLetter(writing, { visibility }),
                  onSelectedChange: (selectedAccountIds) =>
                    changeLetter(writing, { selectedAccountIds }),
                }}
                ready={motion === 'still' && isReady(letters[writing])}
                onSend={handleSend}
              />
            )}
          </div>
        )}
      </div>

      {stampDrawerOpen && (
        <LetterStampPanel
          id={stampPanelId}
          side={side}
          onAdd={handleAddStamp}
          onClose={handleCloseStamps}
        />
      )}
    </div>
  );
}
