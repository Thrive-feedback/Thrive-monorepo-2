import type { GroupPerson } from '@/components/organisms/people-dialog-button';
import type { TextTags } from '@/lib/feedback/text-tags.type';
import type {
  PostcardAsk,
  PostcardAskSticker,
  PostcardWriter,
} from './postcard-draft.type';

/** Feedback given unasked, as it was sent: everything on the card, none of it to be changed. */
export type GivenPostcard = Omit<PostcardAsk, 'requester'> & {
  readonly kind: 'give';
  readonly giver: PostcardWriter;
  readonly receivers: readonly [GroupPerson, ...GroupPerson[]];
  readonly messageTags: TextTags;
  /** When it was sent, as an ISO date. */
  readonly sentOn: string;
};

/** One answer on a request's card. Its stickers are all on the back, as they were written. */
export type PostcardReadAnswer = {
  readonly giver: PostcardWriter;
  readonly message: string;
  readonly messageTags: TextTags;
  readonly stickers: readonly PostcardAskSticker[];
  readonly textStyle: PostcardAsk['textStyle'];
  /** When it was sent, as an ISO date. */
  readonly sentOn: string;
};

/**
 * A Feedback Request that has been answered: the Ask as its Requester wrote it, and every answer
 * this reader may read. A Giver has their own alone; the Requester has them all.
 */
export type AnsweredPostcard = {
  readonly kind: 'ask';
  readonly ask: PostcardAsk;
  readonly messageTags: TextTags;
  readonly answers: readonly [PostcardReadAnswer, ...PostcardReadAnswer[]];
};

/** A postcard to read: one that was sent, with nothing left to write on it. */
export type ReadPostcard = GivenPostcard | AnsweredPostcard;
