import type { SELECTED_PEOPLE } from '@/components/organisms/visibility-picker';
import type { PaperTone, PostcardTextStyle } from './postcard-style.constant';

/**
 * Who else can read a postcard; whoever it is for always can. The values are the API's own, so a
 * caller hands them on unchanged. `ONLY_ME` is shown to the Giver as "Only them".
 */
export type PostcardVisibility =
  | 'ONLY_ME'
  | typeof SELECTED_PEOPLE
  | 'EVERYONE';

/** Who is writing, as the card signs it. */
export type PostcardWriter = {
  readonly name: string;
  readonly photoUrl: string | null;
};

/**
 * Everything on a postcard when Seal & Send is pressed. The Feedback itself is who it is for,
 * the message and who else can read it; the picture, the paper and the text's style are how it
 * looks.
 */
export type PostcardDraft = {
  readonly recipientAccountIds: readonly string[];
  readonly message: string;
  readonly visibility: PostcardVisibility;
  /**
   * Who else can read it. As handed to `onSend`, empty unless `visibility` is Selected people,
   * and never a Receiver; while writing, the picker keeps its list so switching back restores it.
   */
  readonly selectedAccountIds: ReadonlySet<string>;
  /** The picture on the front: a key from `POSTCARD_TEMPLATES`. */
  readonly templateKey: string;
  readonly tone: PaperTone;
  readonly textStyle: PostcardTextStyle;
};

/** Which card: Feedback given unasked, a Feedback Request, or the answer to one Ask. */
export type PostcardKind = 'give' | 'ask' | 'answer';

/** The Ask being answered, as its Requester wrote it: shown read-only on the left half. */
export type PostcardAsk = {
  readonly requester: PostcardWriter;
  /** The Request message. */
  readonly message: string;
  /** The Requester's paper, which the answer is written on too. */
  readonly tone: PaperTone;
  readonly textStyle: PostcardTextStyle;
};

/** Everything on an answer when Send answer is pressed: the Feedback message and how it looks. */
export type PostcardAnswer = {
  readonly message: string;
  readonly textStyle: PostcardTextStyle;
};
