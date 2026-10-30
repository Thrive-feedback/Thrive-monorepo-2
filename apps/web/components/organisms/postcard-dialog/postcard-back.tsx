import { PostcardAddress, PostcardFrom } from './postcard-address';
import type {
  PostcardCard,
  PostcardKind,
  PostcardWriter,
} from './postcard-draft.type';
import {
  PostcardAnswerPlaceholder,
  PostcardAskReadOnly,
  PostcardSplitBack,
} from './postcard-split-back';

/**
 * Keeps the address, and so the message under it, clear of the stamp's square in the top-right
 * corner: the line is tall enough to bring the message below it, and stops short of it where they
 * share a row. A request's corner is on the other half from `md`, so its address needs neither
 * there.
 */
const STAMP_CLEARANCE: Readonly<
  Record<Exclude<PostcardKind, 'answer'>, string>
> = {
  give: 'min-h-18.5 content-start pe-21 md:min-h-16.5 md:pe-18',
  ask: 'min-h-18.5 content-start pe-21 md:min-h-0 md:pe-0',
};

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
            {/* From `md` this half holds the stamp's corner. */}
            <div className="md:min-h-17.5 md:pe-21">
              <PostcardFrom writer={writer} />
            </div>
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
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 pt-5 pb-5 md:px-8 md:pt-7 md:pb-7">
      {address}
      {message}
    </div>
  );
}
