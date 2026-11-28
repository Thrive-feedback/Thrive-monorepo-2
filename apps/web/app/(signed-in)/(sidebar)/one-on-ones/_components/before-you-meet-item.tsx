import { CheckIcon, PlusIcon } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import type { MeetingPeople } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/meeting-summary';
import {
  waitingDaysOf,
  whoPartsOf,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/meeting-context.util';
import type { MeetingContextCard } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';
import { describeMeeting } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-schedule.util';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import {
  FEED_CARD_FILL,
  FEED_CARD_GROUND,
} from '@/components/organisms/feed-card/feed-card-tone.constant';
import type { FeedCardTone } from '@/components/organisms/feed-card/feed-card-tone.type';
import { useIsCutOff } from '@/components/organisms/feed-card/use-is-cut-off';
import { FeedbackText } from '@/components/organisms/feedback-text';
import { cn } from '@/lib/cn.util';

export type BeforeYouMeetItemProps = {
  card: MeetingContextCard;
  people: MeetingPeople;
  /** Today on the schedule's clock, `YYYY-MM-DD`: how long an Ask has waited is counted to it. */
  today: string;
  /** Whether it is on the next meeting's agenda already. */
  isOnAgenda: boolean;
  /** While any write to the 1:1 is on its way. */
  isPending: boolean;
  onAdd: () => void;
};

/** Each kind in its own voice: plum for Feedback given unasked, blue for anything asked, orange for Kudos. */
function toneOf(card: MeetingContextCard): FeedCardTone {
  if (card.kind === 'KUDOS') {
    return 'secondary';
  }
  if (card.kind === 'ASK') {
    return 'tertiary';
  }
  return card.question === null ? 'primary' : 'tertiary';
}

/** The kind, said to a screen reader in place of the dot a sighted reader sees. */
function kindOf(card: MeetingContextCard): string {
  switch (card.kind) {
    case 'KUDOS':
      return 'Kudos';
    case 'ASK':
      return 'Open ask';
    default:
      return card.question === null ? 'Feedback' : 'Answer';
  }
}

/**
 * One card read before a meeting, as lean as it can be read: its kind is the colour of its dot and
 * its ground, as a card in a list is; one line says who it is from and to, the people set apart from
 * the words between them, then when; then what it says, three lines at a time, with Read all when
 * they run longer. Add to agenda stands at its end, in the middle of its height. An Ask says how long it has waited instead of when.
 */
export function BeforeYouMeetItem({
  card,
  people,
  today,
  isOnAgenda,
  isPending,
  onAdd,
}: BeforeYouMeetItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wordsId = useId();
  const whoId = useId();
  const wordsRef = useRef<HTMLParagraphElement>(null);
  // Measured, not guessed from a length: the same words fit a wide panel and not a phone.
  const isCutOff = useIsCutOff(wordsRef, !isOpen);
  const tone = toneOf(card);
  const words = card.kind === 'ASK' ? card.question : card.message;
  const days = card.kind === 'ASK' ? waitingDaysOf(card.askedAt, today) : 0;
  const when =
    card.kind === 'ASK'
      ? days === 0
        ? 'waiting since today'
        : `waiting ${days} ${days === 1 ? 'day' : 'days'}`
      : describeMeeting(card.writtenAt);

  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-control px-4 py-2.5',
        FEED_CARD_GROUND[tone],
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Text
          as="p"
          id={whoId}
          variant="body-2"
          className="flex min-w-0 flex-wrap items-center gap-x-2"
        >
          <span
            aria-hidden="true"
            className={cn('size-2 shrink-0 rounded-full', FEED_CARD_FILL[tone])}
          />
          <span className="sr-only">{`${kindOf(card)}: `}</span>
          <span>
            {whoPartsOf(card, people).map((part, index) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: the parts are one fixed sentence, never reordered.
                key={index}
                className={
                  part.isName
                    ? 'font-semibold text-fg-primary'
                    : 'text-fg-muted'
                }
              >
                {part.text}
              </span>
            ))}
          </span>
          <span className="text-body-3 text-fg-muted tabular-nums">
            <span className="sr-only">, </span>
            {when}
          </span>
        </Text>
        {card.kind === 'FEEDBACK' && card.question && (
          <Text as="p" variant="body-3" className="text-action-tertiary">
            {`Answering: ${card.question}`}
          </Text>
        )}
        <Text
          as="p"
          id={wordsId}
          ref={wordsRef}
          variant="body-1"
          className={cn(
            'max-w-prose whitespace-pre-line',
            !isOpen && 'line-clamp-3',
          )}
        >
          <FeedbackText text={words} tags={card.messageTags} />
        </Text>
        {(isOpen || isCutOff) && (
          <Button
            variant="ghost"
            size="sm"
            className="-ms-3 self-start"
            aria-expanded={isOpen}
            aria-controls={wordsId}
            onClick={() => setIsOpen((open) => !open)}
          >
            {isOpen ? 'Show less' : 'Read all'}
          </Button>
        )}
      </div>
      {/* At the card's end, in the middle of its height, however long its words run. One button in
          both states, so focus stays on it once it is pressed: on the agenda, it says so, quietly,
          and does nothing. Described by who the card is from, as five read alike. */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          '-me-2 -my-1.5 shrink-0',
          isOnAgenda &&
            'aria-disabled:cursor-default aria-disabled:bg-transparent aria-disabled:text-fg-muted aria-disabled:hover:bg-transparent',
        )}
        aria-disabled={isOnAgenda || isPending || undefined}
        aria-describedby={whoId}
        prefixIcon={
          isOnAgenda ? (
            <CheckIcon
              aria-hidden="true"
              className="size-4 text-status-success-active"
            />
          ) : (
            <PlusIcon aria-hidden="true" className="size-4" />
          )
        }
        onClick={() => {
          if (!isOnAgenda && !isPending) {
            onAdd();
          }
        }}
      >
        {/* On a phone the icon alone, so the names and when keep the line; the name stays. */}
        <span className="sr-only sm:not-sr-only">
          {isOnAgenda ? 'On the agenda' : 'Add to agenda'}
        </span>
      </Button>
    </li>
  );
}
