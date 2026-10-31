import type { PostcardKind } from './postcard-draft.type';

/**
 * Everything around the card as it is sent: the title, Close, Turn over, the status and the bar
 * fade on the fast step, so only the card is left to be postmarked and flown off.
 */
export const SENT_AWAY =
  'opacity-0 transition-opacity duration-fast ease-smooth-out motion-reduce:transition-none';

/** The whole screen as the dialog, so a card taller than the window scrolls rather than being cut off. */
export const POSTCARD_SCREEN =
  'translate-none inset-0 top-0 mx-0 max-h-none max-w-none gap-0 overflow-y-auto overflow-x-hidden rounded-none border-0 bg-transparent p-4 shadow-none focus-visible:outline-hidden md:p-8';

/** The column everything sits in, wider than the card, so the tools fit on one line beside Send. */
export const POSTCARD_PAGE =
  'mx-auto my-auto flex w-full max-w-5xl flex-col items-center gap-4';

/** The card, at its width, with what turns it over. */
export const POSTCARD_CARD_COLUMN =
  'relative flex w-full max-w-2xl flex-col gap-3';

/** The buttons for the card itself: beside it where there is room, so they never cover the writing; above it on a narrow screen. */
export const POSTCARD_CARD_ACTIONS =
  'flex gap-2 self-end lg:absolute lg:top-1/2 lg:left-full lg:ml-6 lg:-translate-y-1/2 lg:flex-col';

/** A pill under the card: the bar of its tools, and the box of who else can read it and Send. */
export const POSTCARD_BAR =
  'flex max-w-full items-center rounded-control border border-border-muted bg-surface-raised p-1.5 shadow-high';

/** What selects the stamp, among the stickers' ids: a card has only one. */
export const STAMP_ID = 'stamp';

/** What the bar is called to a screen reader, for whichever tools it holds. */
export const BAR_LABELS = {
  text: 'Text style',
  cover: 'Front tools',
  card: 'Postcard tools',
} as const;

/** The words each card uses, so the three read as one family. */
export const COPY: Readonly<
  Record<
    PostcardKind,
    {
      send: string;
      messageLabel: string;
      placeholder: string;
      status: string;
      /** Under the bar while the front shows. */
      coverStatus: string;
      lost: string;
    }
  >
> = {
  give: {
    send: 'Send feedback',
    messageLabel: 'Your feedback',
    placeholder:
      "Share what you've seen: what went well, and what could go differently next time.",
    status: 'Turn the card over to see the front.',
    coverStatus:
      'The front: choose its picture from Templates. Turn it over to write.',
    lost: 'What you wrote, and who it was for, will be lost.',
  },
  ask: {
    send: 'Send request',
    messageLabel: 'Your request',
    placeholder:
      'What would you like advice on? Think of something you can do differently next time.',
    status: 'Write your request on the left; their answers go on the right.',
    coverStatus:
      'The front: choose its picture from Templates. Turn it over to write.',
    lost: 'What you wrote, and who you asked, will be lost.',
  },
  answer: {
    send: 'Send answer',
    messageLabel: 'Your answer',
    placeholder:
      "Share what you've seen and what could go differently next time.",
    status: 'Write your answer on the right. The left is their request.',
    coverStatus:
      'The front is their picture. Turn it over to write your answer.',
    lost: 'Your answer will be lost.',
  },
};
