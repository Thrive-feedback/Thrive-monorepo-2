import { useState } from 'react';
import { Text } from '@/components/atoms/text';
import { TimeAgo } from '@/components/atoms/time-ago';
import { FeedbackText } from '@/components/organisms/feedback-text';
import { kudosCardDate } from '@/components/organisms/kudos-dialog/kudos-card.util';
import { KudosCardReadDialog } from '@/components/organisms/kudos-dialog/kudos-card-read-dialog';
import { KudosCardReadOnly } from '@/components/organisms/kudos-dialog/kudos-card-read-only';
import type { ReadKudos } from '@/components/organisms/kudos-dialog/read-kudos.type';
import { cn } from '@/lib/cn.util';
import { FeedCardColumns } from './feed-card-columns';
import { FeedCardPreview } from './feed-card-preview';
import {
  feedCardGiver,
  NO_NAME_IN_A_SENTENCE,
} from './feed-card-sentence.util';
import { FEED_CARD_KIND_INK } from './feed-card-tone.constant';
import { FeedCardWho } from './feed-card-who';

export type KudosFeedCardProps = {
  kudos: ReadKudos;
  /** Who is reading, so the card can say "You" where it names them. */
  readerAccountId: string;
};

/**
 * One Kudos on Home, drawn as every card in a list is: who gave it to whom, that it is a Kudos and
 * how long ago, and the message cut at three lines, with the card it was written on made small in
 * the column beside them. Pressing that card opens it large. Every Member reads every Kudos, so it
 * says nothing about who can.
 */
export function KudosFeedCard({ kudos, readerAccountId }: KudosFeedCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <FeedCardColumns
      tone="secondary"
      note="Open the card"
      aside={
        <FeedCardPreview
          id={kudos.id}
          target={{ onSelect: () => setIsOpen(true) }}
          label={`Open kudos from ${kudos.giver.name ?? NO_NAME_IN_A_SENTENCE}`}
        >
          <span className="block w-20">
            <KudosCardReadOnly
              message={kudos.message}
              tags={kudos.messageTags}
              drawing={kudos.drawing}
              date={kudosCardDate(kudos.givenAt)}
            />
          </span>
        </FeedCardPreview>
      }
    >
      <header className="flex min-w-0 flex-col gap-2">
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
          <span className={cn('font-medium', FEED_CARD_KIND_INK.secondary)}>
            Kudos
          </span>
          <span aria-hidden="true">·</span>
          <TimeAgo dateTime={kudos.givenAt} />
        </Text>
      </header>
      <Text
        as="p"
        variant="body-1"
        className="line-clamp-3 whitespace-pre-line break-words"
      >
        <FeedbackText text={kudos.message} tags={kudos.messageTags} />
      </Text>
      <KudosCardReadDialog
        kudos={kudos}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </FeedCardColumns>
  );
}
