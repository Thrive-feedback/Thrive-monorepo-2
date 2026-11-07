import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { WaitingAskCard } from '@/components/organisms/feed-card/waiting-ask-card';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { CardCover } from './card-cover';
import { SAMPLE_ASKED_CARD, SAMPLE_TARGET } from './feed-card-samples.constant';

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

export function WaitingAskCardEntry() {
  return (
    <ShowcaseEntry
      name="WaitingAskCard"
      level="organism"
      origin="thrive"
      source="components/organisms/feed-card/waiting-ask-card.tsx — FeedCardColumns + FeedCardPreview + PendingPostcardMiniature."
      summary="An Ask waiting for the person, drawn as every card in a list is: who asked, that it is a request and when, beside the postcard it is answered on, leaning, then the Request message cut at three lines."
      useFor="One Ask in the Waiting for me menu of the new Home."
      avoidFor="Feedback already written: use FeedCard. /home's waiting list, which keeps ActivityRow."
      usage={`import { WaitingAskCard } from '@/components/organisms/feed-card/waiting-ask-card';

<WaitingAskCard
  ask={ask}
  card={ask.card}
  target={{ href: ROUTES.waitingAsk(ask.askId) }}
/>`}
      props={[
        {
          name: 'ask',
          type: 'MyAsk',
          description: 'One Ask waiting for the person.',
        },
        {
          name: 'card',
          type: 'AskedPostcard',
          description:
            'The card the request was sent on, drawn small, blank where the answer goes.',
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
        'The small postcard straightens under keyboard focus as it does under the cursor.',
        'It says nothing about who else can read the answer.',
      ]}
    >
      {CASES.map(({ label, hint, ask }) => (
        <StateCell key={label} label={label} hint={hint} wide>
          <div className="w-full max-w-180">
            <WaitingAskCard
              ask={ask}
              card={SAMPLE_ASKED_CARD}
              target={SAMPLE_TARGET}
            />
          </div>
        </StateCell>
      ))}
    </ShowcaseEntry>
  );
}

export function WaitingAskCardPreview() {
  return (
    <CardCover>
      <WaitingAskCard
        ask={AN_ASK}
        card={SAMPLE_ASKED_CARD}
        target={SAMPLE_TARGET}
      />
    </CardCover>
  );
}
