import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { WaitingAskCard } from '@/components/organisms/feed-card/waiting-ask-card';
import { WaitingAskNote } from '@/components/organisms/feed-card/waiting-ask-note';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { SAMPLE_TARGET } from './feed-card-samples.constant';

const AN_ASK: MyAsk = {
  askId: 'ask-1',
  message: 'How clear was the migration plan I shared on Monday?',
  messageTags: NO_TEXT_TAGS,
  requesterName: 'Ann Lee',
  requesterPhotoUrl: null,
  requesterInactive: false,
  askedAt: '2026-10-31T03:00:00.000Z',
  status: 'PENDING',
};

const CASES: readonly { label: string; hint?: string; ask: MyAsk }[] = [
  {
    label: 'A long request',
    hint: 'Cut at three lines; the postcard shows all of it.',
    ask: {
      ...AN_ASK,
      message:
        'How clear was the migration plan I shared on Monday? I would like to know which steps read well, which ones you had to read twice, who you would call first if step three failed, and whether the rollback section says enough for somebody seeing it for the first time.',
    },
  },
  {
    label: 'A Requester since Deactivated',
    ask: { ...AN_ASK, requesterInactive: true },
  },
  {
    label: 'A Requester who has not introduced themselves',
    ask: { ...AN_ASK, requesterName: null },
  },
];

/** One Ask for each way the note lies: an Ask's id picks it. */
const NOTE_CASES = ['ask-1', 'ask-2', 'ask-3', 'ask-4', 'ask-5'].map(
  (askId) => ({ ...AN_ASK, askId }),
);

export function WaitingAskCardEntry() {
  return (
    <ShowcaseEntry
      name="WaitingAskCard"
      level="organism"
      origin="thrive"
      source="components/organisms/feed-card/waiting-ask-card.tsx — the ground of a feed card + WaitingAskNote + PendingMiniPostcard."
      summary="An Ask waiting for the person: who asked, when, and the Request message, beside the postcard it is answered on and a handwritten note pointing to it."
      useFor="One Ask in the Waiting for me menu of the new Home."
      avoidFor="Feedback already written: use FeedCard. /home's waiting list, which keeps ActivityRow."
      usage={`import { WaitingAskCard } from '@/components/organisms/feed-card/waiting-ask-card';

<WaitingAskCard
  ask={ask}
  target={{ href: ROUTES.brandNewWaitingAsk(ask.askId) }}
/>`}
      props={[
        {
          name: 'ask',
          type: 'MyAsk',
          description: 'One Ask waiting for the person.',
        },
        {
          name: 'target',
          type: 'NavTarget',
          description:
            'What pressing the small postcard does: an address or a callback.',
        },
      ]}
      accessibility={[
        'The small postcard is the one link on the card, named "Answer in the postcard:" and who asked.',
        'The handwritten note only points the way, so it is hidden from screen readers.',
        'It says nothing about who else can read the answer.',
      ]}
    >
      <StateCell
        label="Five ways the note lies"
        hint="An Ask's id picks one, so a card keeps its note after a reload."
        wide
      >
        <ul className="flex w-full max-w-200 flex-col gap-1.5">
          {NOTE_CASES.map((ask) => (
            <li key={ask.askId}>
              <WaitingAskCard ask={ask} target={SAMPLE_TARGET} />
            </li>
          ))}
        </ul>
      </StateCell>
      {CASES.map(({ label, hint, ask }) => (
        <StateCell key={label} label={label} hint={hint} wide>
          <div className="w-full max-w-180">
            <WaitingAskCard ask={ask} target={SAMPLE_TARGET} />
          </div>
        </StateCell>
      ))}
    </ShowcaseEntry>
  );
}

export function WaitingAskCardPreview() {
  return <WaitingAskNote lie="level" />;
}
