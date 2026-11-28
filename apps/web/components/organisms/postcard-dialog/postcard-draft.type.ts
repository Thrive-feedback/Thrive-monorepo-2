import type { RefObject } from 'react';
import type { Teammate } from '@/lib/feedback/teammate.type';
import type { TextTags } from '@/lib/feedback/text-tags.type';
import type { KeptAudience } from '@/lib/feedback/use-mentioned-audience';
import type { Visibility } from '@/lib/feedback/visibility.type';
import type { PaperTone, PostcardTextStyle } from './postcard-style.constant';

/**
 * Who else can read a postcard; whoever it is for always can. The values are the API's own, so a
 * caller hands them on unchanged. `ONLY_ME` is shown to the Giver as "Only them".
 */
export type PostcardVisibility = Visibility;

/** The two sides of a postcard: the picture on the front, the message on the back. */
export type PostcardSide = 'front' | 'back';

/**
 * A sticker stuck on one side of a card. Its centre is held as a share of that side's width and
 * height, so it stays put as the card grows; `scale` is against the sticker's usual size and
 * `rotation` is in degrees.
 */
export type PlacedPostcardSticker = {
  readonly id: string;
  /** Which sticker: a key from `POSTCARD_STICKERS`. */
  readonly stickerKey: string;
  readonly side: PostcardSide;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly rotation: number;
};

/** Who is writing, as the card signs it. */
export type PostcardWriter = {
  readonly name: string;
  readonly photoUrl: string | null;
  /** Deactivated in this Workspace, which a card read later than it was written can show. */
  readonly inactive?: boolean;
};

/**
 * Everything on a postcard when Send is pressed. The Feedback itself is who it is for,
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
  /** Up to `MAX_STICKERS`, on either side. */
  readonly stickers: readonly PlacedPostcardSticker[];
  /** The card's one stamp, a key from `POSTCARD_STAMPS`, always in the top-right of the back. */
  readonly stampKey: string | null;
  readonly tone: PaperTone;
  readonly textStyle: PostcardTextStyle;
};

/** Which card: Feedback given unasked, a Feedback Request, or the answer to one Ask. */
export type PostcardKind = 'give' | 'ask' | 'answer';

/** A sticker the Requester stuck on: where it is and how it looks, and nothing can change it. */
export type PostcardAskSticker = Omit<PlacedPostcardSticker, 'id'>;

/**
 * The Ask being answered, as its Requester wrote it. A request and its answers are one card, so
 * everything on it shows while answering, and none of it can be changed.
 */
export type PostcardAsk = {
  readonly requester: PostcardWriter;
  /** The picture on the front: a key from `POSTCARD_TEMPLATES`. */
  readonly templateKey: string;
  readonly stickers: readonly PostcardAskSticker[];
  /** The card's one stamp, a key from `POSTCARD_STAMPS`, or `null` for none. */
  readonly stampKey: string | null;
  /** The Request message. */
  readonly message: string;
  /** What the Request message was bound to when it was sent. */
  readonly messageTags?: TextTags;
  /** The Requester's paper, which the answer is written on too. */
  readonly tone: PaperTone;
  readonly textStyle: PostcardTextStyle;
};

/**
 * Everything on an answer when Send answer is pressed: the Feedback message and how it looks,
 * stickers included. The front and the stamp are the Requester's, so an answer's stickers are all
 * on the back.
 */
export type PostcardAnswer = {
  readonly message: string;
  readonly stickers: readonly PlacedPostcardSticker[];
  readonly textStyle: PostcardTextStyle;
};

/** What was written so far, carried to the other style when the writer switches mid-way. */
export type WrittenSoFar = {
  readonly message: string;
  readonly recipientAccountIds: readonly string[];
  /** Who else can read it, as chosen; a switch must never widen it. */
  readonly audience: KeptAudience;
};

/** Where a page stood in its screen when the writer switched style, to hold the next one there. */
export type PagePin = {
  /** The top margin that holds the page where it was. */
  readonly top: number;
  /** How far the screen had scrolled. */
  readonly scrollTop: number;
  /** How tall the page was, so the next is no shorter and its screen can scroll as far. */
  readonly height: number;
};

/**
 * What one opening of the writing dialog shares between its two styles, the postcard and the plain
 * sheet, so a switch from one to the other is one dialog carrying on, not a new one.
 */
export type StyleSwitching = {
  /** The writer switched style: what they wrote, and where the page stood. */
  readonly onSwitch: (written: WrittenSoFar, pin: PagePin | null) => void;
  /** This editor took the other style's place in a dialog already open. */
  readonly isSwitchedIn: boolean;
  /** Where the page stood at the last switch; `null` until then, so it centres itself. */
  readonly pin: PagePin | null;
  /** What opened the dialog, so closing it from either style gives focus back there. */
  readonly openerRef: RefObject<HTMLElement | null>;
  /**
   * Set as a switch takes one style's editor away, so its going does not hand focus out of a
   * dialog that is still open.
   */
  readonly isSwitchingRef: RefObject<boolean>;
  /** Who the opening was addressed to by its caller, before any switch carried a choice over. */
  readonly openingRecipientAccountIds: readonly string[];
};

/** Which card is written, with what only that card needs. */
export type PostcardCard =
  | {
      kind: Exclude<PostcardKind, 'answer'>;
      teammates: readonly Teammate[];
      workspaceGoals: readonly string[];
      /** Who it is for as it opens. Read once: the card owns it from then on. */
      defaultRecipientAccountIds: readonly string[];
      /** What is already written as it opens, as typed before choosing this card. */
      defaultMessage: string;
      /** Who else can read it as it opens, carried from the other style; Everyone unless given. */
      defaultAudience?: KeptAudience;
      onSend: (postcard: PostcardDraft) => Promise<boolean>;
    }
  | {
      kind: 'answer';
      teammates: readonly Teammate[];
      workspaceGoals: readonly string[];
      ask: PostcardAsk;
      /** What is already written as it opens: the answer so far, carried from the other style. */
      defaultMessage?: string;
      onSend: (answer: PostcardAnswer) => Promise<boolean>;
    };
