import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { KudosCardDemo } from './kudos-card-demos';
import {
  KUDOS_CASES,
  SAMPLE_KUDOS,
  SAMPLE_KUDOS_TO_THE_READER,
} from './kudos-samples.constant';

export function KudosCardReadOnlyEntry() {
  return (
    <ShowcaseEntry
      name="KudosCardReadOnly"
      level="organism"
      origin="thrive"
      source="components/organisms/kudos-dialog/kudos-card-read-only.tsx — KudosCardFace + KudosCardBack + KudosCardTurn + FeedbackText + PostcardStickerReadOnly"
      summary="A sent Kudos card exactly as its Giver left it, at whatever width it is given. It is laid out at the size it was written at and scaled as one piece, so its lines break in the same places and its stickers keep their size against the card."
      useFor="Drawing a sent Kudos anywhere: the board, Home's feed, the large dialog."
      avoidFor="Writing one, which is KudosDialog. The old /home feed, which keeps KudosCard."
      usage={`import { KudosCardReadOnly } from '@/components/organisms/kudos-dialog/kudos-card-read-only';

<KudosCardReadOnly
  message={kudos.message}
  tags={kudos.messageTags}
  drawing={kudos.drawing}
  date={kudosCardDate(kudos.givenAt)}
/>`}
      props={[
        {
          name: 'message',
          type: 'string',
          description: 'What the Giver wrote.',
        },
        {
          name: 'tags',
          type: 'TextTags',
          description: 'What the message was bound to when it was sent.',
        },
        {
          name: 'drawing',
          type: 'KudosCardDrawing',
          description:
            'How the card looks: its template, how its words are set, and its stickers.',
        },
        {
          name: 'date',
          type: 'string',
          description:
            'As kudosCardDate writes it: the day it was given, on the back.',
        },
        {
          name: 'side',
          type: "'front' | 'back'",
          defaultValue: "'front'",
          description: 'The side to show. A change turns the card over to it.',
        },
        {
          name: 'areStickersHidden',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Leaves the stickers off for now, so what lies under them can be read.',
        },
      ]}
      accessibility={[
        'The words are text. A sticker is decoration, with an empty alt.',
        'The side not showing is hidden and inert, so it cannot be reached or read out.',
        'The turn plays in two halves, at once with reduced motion.',
      ]}
    >
      {KUDOS_CASES.map(({ label, kudos }) => (
        <StateCell key={label} label={label}>
          <div className="w-52">
            <KudosCardDemo kudos={kudos} />
          </div>
        </StateCell>
      ))}
      <StateCell label="The back" hint="The same on every template.">
        <div className="w-52">
          <KudosCardDemo kudos={SAMPLE_KUDOS} side="back" />
        </div>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function KudosCardReadOnlyPreview() {
  return (
    <div className="w-24">
      <KudosCardDemo kudos={SAMPLE_KUDOS_TO_THE_READER} />
    </div>
  );
}
