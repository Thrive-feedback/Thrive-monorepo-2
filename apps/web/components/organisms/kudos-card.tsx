import { Text } from '@/components/atoms/text';
import { CardStamp } from '@/components/molecules/card-stamp';
import type { KudosItem, KudosPerson } from '@/lib/feedback/kudos-item.type';
import { FeedbackText } from './feedback-text';
import { GiverToReceivers } from './giver-to-receivers';

export type KudosCardProps = {
  item: KudosItem;
};

/** A Kudos carries no photo of anyone, so every face on it is initials. */
function withoutPhoto(person: KudosPerson) {
  return { ...person, photoUrl: null };
}

/**
 * One Kudos on a feed: who gave it to whom — one person or many — opened the same way as a
 * Feedback card, the brand-coloured Kudos badge over the day in the corner, and the message.
 * The badge is what marks it as a Kudos. No Reactions yet: they are Feedback's (#92).
 */
export function KudosCard({ item }: KudosCardProps) {
  return (
    <article className="flex flex-col gap-3 py-5">
      <header className="flex items-start justify-between gap-3">
        <GiverToReceivers
          giver={withoutPhoto(item.giver)}
          receivers={item.recipients.map(withoutPhoto)}
          kind="Kudos"
        />
        <CardStamp label="Kudos" tone="brand" dateTime={item.givenAt} />
      </header>
      <Text as="p" variant="body-1" className="whitespace-pre-line break-words">
        <FeedbackText text={item.message} tags={item.messageTags} />
      </Text>
    </article>
  );
}
