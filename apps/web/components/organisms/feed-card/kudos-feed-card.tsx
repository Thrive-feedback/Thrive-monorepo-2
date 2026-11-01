import { ChevronRightIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { TimeAgo } from '@/components/atoms/time-ago';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { kudosCardDate } from '@/components/organisms/kudos-dialog/kudos-card.util';
import { KudosCardFace } from '@/components/organisms/kudos-dialog/kudos-card-face';
import { KudosCardReadDialog } from '@/components/organisms/kudos-dialog/kudos-card-read-dialog';
import { KudosCardReadOnly } from '@/components/organisms/kudos-dialog/kudos-card-read-only';
import { shakeKudosCard } from '@/components/organisms/kudos-dialog/kudos-card-shake.util';
import type { KudosTemplateKey } from '@/components/organisms/kudos-dialog/kudos-template.constant';
import type { ReadKudos } from '@/components/organisms/kudos-dialog/read-kudos.type';
import {
  kudosNeighboursOf,
  kudosTiltOf,
} from '@/components/organisms/kudos-dialog/read-kudos.util';
import { cn } from '@/lib/cn.util';
import { feedCardGiver } from './feed-card-sentence.util';
import { FEED_CARD_SURFACE } from './feed-card-surface.constant';
import { FeedCardWho } from './feed-card-who';
import styles from './kudos-feed-card.module.css';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

type KudosBoardNeighbourProps = {
  /** Sets how far it leans. */
  id: string;
  templateKey: KudosTemplateKey;
};

/** A blank card hanging beside a Kudos. Nothing here is a real Kudos: it is the board behind it. */
function KudosBoardNeighbour({ id, templateKey }: KudosBoardNeighbourProps) {
  return (
    <div className="w-56 shrink-0" style={{ rotate: `${kudosTiltOf(id)}deg` }}>
      <KudosCardFace templateKey={templateKey} />
    </div>
  );
}

export type KudosFeedCardProps = {
  kudos: ReadKudos;
  /** Who is reading, so the card can say "You" where it names them. */
  readerAccountId: string;
};

/**
 * One Kudos on Home: who gave it to whom, that it is a Kudos and how long ago, and the card itself,
 * whole and in focus, leaning on a small board of blurred cards that runs past both edges, so a
 * wider screen simply shows more of it. The cursor coming onto the card gives it a little shake.
 * Pressing the card opens it large, as `View kudos` does for
 * anybody not using a mouse. Every Member reads every Kudos, so it says nothing about who can.
 */
export function KudosFeedCard({ kudos, readerAccountId }: KudosFeedCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { left, right } = kudosNeighboursOf(
    kudos.id,
    kudos.drawing.templateKey,
  );

  // A cursor arriving is the only thing that moves it: a finger has no way to pass over a card.
  function handlePointerEnter(event: React.PointerEvent) {
    const prefersStillness = window.matchMedia(REDUCED_MOTION).matches;
    if (cardRef.current && event.pointerType === 'mouse' && !prefersStillness) {
      shakeKudosCard(cardRef.current);
    }
  }

  return (
    <article className={FEED_CARD_SURFACE}>
      <header className="flex items-start gap-3">
        <PhotoAvatar
          name={kudos.giver.name ?? ''}
          photoUrl={kudos.giver.photoUrl}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <FeedCardWho
            giver={kudos.giver}
            receivers={kudos.recipients}
            verb="gave kudos"
            peopleDescription={`${feedCardGiver(kudos.giver, readerAccountId)} sent this Kudos to all of them.`}
            readerAccountId={readerAccountId}
          />
          <Text
            as="div"
            variant="body-3"
            tone="muted"
            className="flex flex-wrap items-center gap-x-2 gap-y-1"
          >
            <span className="text-fg-primary">Kudos</span>
            <span aria-hidden="true">·</span>
            <TimeAgo dateTime={kudos.givenAt} />
          </Text>
        </div>
      </header>
      <div className="relative isolate overflow-hidden rounded-page bg-surface-base px-4 py-6">
        <div
          aria-hidden="true"
          className={cn(
            'absolute inset-0 flex items-center justify-center gap-4 md:gap-6',
            styles.neighbours,
          )}
        >
          {left.map((templateKey, place) => (
            <KudosBoardNeighbour
              key={templateKey}
              id={`${kudos.id}:left:${place}`}
              templateKey={templateKey}
            />
          ))}
          <div className="w-48 shrink-0 md:w-60" />
          {right.map((templateKey, place) => (
            <KudosBoardNeighbour
              key={templateKey}
              id={`${kudos.id}:right:${place}`}
              templateKey={templateKey}
            />
          ))}
        </div>
        <div
          aria-hidden="true"
          className={cn('absolute inset-0', styles.veil)}
        />
        <div
          ref={cardRef}
          className="relative mx-auto w-48 md:w-60"
          style={{ rotate: `${kudosTiltOf(kudos.id)}deg` }}
        >
          <KudosCardReadOnly
            message={kudos.message}
            tags={kudos.messageTags}
            drawing={kudos.drawing}
            date={kudosCardDate(kudos.givenAt)}
          />
          {/* A mouse's way in, for what `View kudos` already offers everybody. */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setIsOpen(true)}
            onPointerEnter={handlePointerEnter}
            className="absolute inset-0 cursor-pointer rounded-element"
          />
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="self-start"
      >
        View kudos
        <ChevronRightIcon aria-hidden="true" className="size-4" />
      </Button>
      <KudosCardReadDialog
        kudos={kudos}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </article>
  );
}
