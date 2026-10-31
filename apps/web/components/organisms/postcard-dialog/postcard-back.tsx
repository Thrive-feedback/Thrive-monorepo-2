import { PostcardAddress } from './postcard-address';
import { FULL_BACK, STAMP_CLEARANCE } from './postcard-back.constant';
import type {
  PostcardCard,
  PostcardKind,
  PostcardWriter,
} from './postcard-draft.type';
import {
  PostcardAnswerFrom,
  PostcardAnswerPlaceholder,
  PostcardAskReadOnly,
  PostcardSplitBack,
} from './postcard-split-back';

/** Who is chosen after "To", for the cards that choose: what choosing means, and for whom. */
const RECIPIENTS: Readonly<
  Record<
    Exclude<PostcardKind, 'answer'>,
    { label: string; description: string }
  >
> = {
  give: {
    label: "Choose who it's for",
    description: 'They can always read it.',
  },
  ask: {
    label: 'Choose who to ask',
    description: 'They each answer in their own words.',
  },
};

export type PostcardBackProps = {
  card: PostcardCard;
  writer: PostcardWriter;
  /** Who it is for: chosen on the cards that choose, and left alone on an answer. */
  recipientAccountIds: readonly string[];
  /** The field the message is written in, the same on every card. */
  message: React.ReactNode;
  onRecipientsChange: (recipientAccountIds: readonly string[]) => void;
};

/**
 * What is written on the back of each card. Given Feedback fills it, under From and To; a request
 * and an answer halve it, the request on the left and the answer on the right.
 */
export function PostcardBack({
  card,
  writer,
  recipientAccountIds,
  message,
  onRecipientsChange,
}: PostcardBackProps) {
  if (card.kind === 'answer') {
    return (
      <PostcardSplitBack
        ask={<PostcardAskReadOnly ask={card.ask} />}
        answer={
          <>
            <PostcardAnswerFrom writer={writer} />
            {message}
          </>
        }
      />
    );
  }

  const address = (
    <PostcardAddress
      writer={writer}
      teammates={card.teammates}
      recipientAccountIds={recipientAccountIds}
      recipientsLabel={RECIPIENTS[card.kind].label}
      recipientsDescription={RECIPIENTS[card.kind].description}
      onRecipientsChange={onRecipientsChange}
      className={STAMP_CLEARANCE[card.kind]}
    />
  );

  if (card.kind === 'ask') {
    return (
      <PostcardSplitBack
        ask={
          <>
            {address}
            {message}
          </>
        }
        answer={<PostcardAnswerPlaceholder />}
      />
    );
  }

  return (
    <div className={FULL_BACK}>
      {address}
      {message}
    </div>
  );
}
