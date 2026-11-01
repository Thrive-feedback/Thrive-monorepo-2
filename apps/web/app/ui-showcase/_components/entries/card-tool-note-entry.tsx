import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { CardToolNote } from '@/components/organisms/postcard-dialog/card-tool-note';
import { CARD_NOTES } from '@/components/organisms/postcard-dialog/card-tool-note.constant';
import {
  CARD_NOTE_ARROW_DOWN,
  CARD_NOTE_ARROW_LEFT,
  CARD_NOTE_ARROW_ON_TOP,
  CARD_NOTE_ARROW_UP,
} from '@/components/organisms/postcard-dialog/postcard-editor.constant';
import { CardNotesDemo } from './card-notes-demo';

const RIGHT = { placeClassName: 'flex', arrowClassName: undefined };
const LEFT = {
  placeClassName: 'flex flex-row-reverse',
  arrowClassName: CARD_NOTE_ARROW_LEFT,
};
const UP = {
  placeClassName: `flex ${CARD_NOTE_ARROW_ON_TOP}`,
  arrowClassName: CARD_NOTE_ARROW_UP,
};
const DOWN = { placeClassName: 'flex', arrowClassName: CARD_NOTE_ARROW_DOWN };

/** Every note a card can show, with where it shows and what brings it up. */
const CASES = [
  {
    label: 'Turn over, on the back',
    hint: 'Give, request, answer. Above the button.',
    note: CARD_NOTES.flipToFront,
    ...DOWN,
  },
  {
    label: 'Turn over, on the front',
    hint: 'Give, request, answer. Above the button.',
    note: CARD_NOTES.flipToBack,
    ...DOWN,
  },
  {
    label: 'Hide, while writing',
    hint: 'Every card, while a sticker is on it.',
    note: CARD_NOTES.hideStickers,
    ...LEFT,
  },
  {
    label: 'Hide, once hidden',
    hint: 'Every card, while its stickers are hidden.',
    note: CARD_NOTES.showStickers,
    ...LEFT,
  },
  {
    label: 'Hide, reading',
    hint: 'A sent card. The stamp stays.',
    note: CARD_NOTES.hideMarks,
    ...LEFT,
  },
  {
    label: 'Hide, reading, once hidden',
    hint: 'A sent card with its stickers and postmark hidden.',
    note: CARD_NOTES.showMarks,
    ...LEFT,
  },
  {
    label: 'Pages of answers',
    hint: 'A sent request with more than one answer, on the back.',
    note: CARD_NOTES.otherAnswers,
    ...LEFT,
  },
  {
    label: 'Done',
    hint: 'Every card, from the first character typed.',
    note: CARD_NOTES.done,
    ...LEFT,
  },
  {
    label: 'Who can read it',
    hint: 'Give and request. Under the box.',
    note: CARD_NOTES.chooseReaders,
    ...UP,
  },
  {
    label: 'Send: nobody chosen',
    hint: 'Give, while it is for nobody.',
    note: CARD_NOTES.needsReceiver,
    ...UP,
  },
  {
    label: 'Send: nobody asked',
    hint: 'Request, while nobody is asked.',
    note: CARD_NOTES.needsAsked,
    ...UP,
  },
  {
    label: 'Send: nothing written',
    hint: 'Every card, while the message is empty.',
    note: CARD_NOTES.needsMessage,
    ...UP,
  },
  {
    label: 'Send: no readers picked',
    hint: 'Give and request, on Selected people with nobody selected.',
    note: CARD_NOTES.needsReaders,
    ...UP,
  },
  {
    label: 'Send: ready',
    hint: 'Every card, once Send can be pressed.',
    note: CARD_NOTES.sendReady,
    ...UP,
  },
  {
    label: 'The front picture',
    hint: 'Give and request, on the front.',
    note: CARD_NOTES.pickPicture,
    ...RIGHT,
  },
  {
    label: 'Stickers',
    hint: 'An answer, on the back.',
    note: CARD_NOTES.addSticker,
    ...RIGHT,
  },
  {
    label: 'Kudos: the words',
    hint: 'Left of the card.',
    note: CARD_NOTES.typeKudos,
    ...RIGHT,
  },
  {
    label: 'Kudos: templates',
    hint: 'Left of the row of small cards.',
    note: CARD_NOTES.changeCardStyle,
    ...RIGHT,
  },
  {
    label: 'Kudos: text tools',
    hint: 'Left of the bar while the words are styled.',
    note: CARD_NOTES.styleWords,
    ...RIGHT,
  },
];

export function CardToolNoteEntry() {
  return (
    <ShowcaseEntry
      name="CardToolNote"
      level="organism"
      origin="thrive"
      source="components/organisms/postcard-dialog/card-tool-note.tsx — HandwrittenNote + HandArrow; the words are in card-tool-note.constant.ts"
      summary="A word by hand on the overlay beside a card, saying how to use one of its tools, with an arrow to that tool. It shows only from 1024px, where there is room beside the card, and not once the writer has turned the notes off. Here each is drawn at every width, with the arrow it has in the dialog."
      useFor="Pointing at a tool on a card being written or read: PostcardDialog, KudosDialog and PostcardReadDialog."
      avoidFor="Anything a person must read: a screen reader skips it, and a phone never shows it."
      usage={`import { CardToolNote } from '@/components/organisms/postcard-dialog/card-tool-note';
import { CARD_NOTES } from '@/components/organisms/postcard-dialog/card-tool-note.constant';

<CardToolNote
  className={CARD_NOTE_UNDER_CONTROL}
  arrowClassName={CARD_NOTE_ARROW_UP}
>
  {CARD_NOTES.chooseReaders}
</CardToolNote>`}
      props={[
        {
          name: 'className',
          type: 'string',
          description: 'Where it sits, against the tool it points at.',
        },
        {
          name: 'arrowClassName',
          type: 'string',
          description:
            'Turns the arrow, which otherwise points right, towards that tool.',
        },
        {
          name: 'hasGone',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'The card has gone, so it fades with everything else around it.',
        },
      ]}
      accessibility={[
        'Hidden from screen readers: every tool it points at names itself.',
        'Why Send is disabled is in the note alone, so a screen reader hears only that it is disabled.',
        'With reduced motion it is simply there rather than written on.',
      ]}
    >
      {CASES.map(({ label, hint, note, placeClassName, arrowClassName }) => (
        <StateCell key={label} label={label} hint={hint}>
          <CardToolNote
            className={placeClassName}
            arrowClassName={arrowClassName}
          >
            {note}
          </CardToolNote>
        </StateCell>
      ))}
      <StateCell
        label="Turning the notes off"
        hint="Under the hide button on every card, from 1024px. Press it. Shown by default, and a card remembers."
      >
        <CardNotesDemo />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function CardToolNotePreview() {
  return (
    <CardToolNote className="flex">{CARD_NOTES.chooseReaders}</CardToolNote>
  );
}
