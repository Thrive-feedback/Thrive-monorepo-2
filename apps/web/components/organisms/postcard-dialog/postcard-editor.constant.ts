import type { PostcardKind } from './postcard-draft.type';

/**
 * Everything around the card as it is sent: the title, Close, Turn over, the status and the bar
 * fade on the fast step, so only the card is left to be postmarked and flown off.
 */
export const SENT_AWAY =
  'opacity-0 transition-opacity duration-fast ease-smooth-out motion-reduce:transition-none';

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
