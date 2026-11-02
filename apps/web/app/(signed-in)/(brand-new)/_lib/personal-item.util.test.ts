import { describe, expect, it } from 'vitest';
import type { PersonalItemOnTheWire } from '@/app/(signed-in)/(brand-new)/_lib/personal-item.type';
import { toPersonalItem } from '@/app/(signed-in)/(brand-new)/_lib/personal-item.util';
import { DEFAULT_TEXT_STYLE } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { POSTCARD_TEMPLATES } from '@/components/organisms/postcard-dialog/postcard-template.constant';

const NO_TAGS = { workspaceGoals: [], mentions: [] };
const SENT_ON = '2026-10-31T03:00:00.000Z';

const BEN = {
  accountId: '0199a0f0-0000-7000-8000-00000000000b',
  name: 'Ben Carter',
  photoUrl: null,
  status: 'ACTIVE',
} as const;
const ANN = { ...BEN, name: 'Ann Lee' };

type FeedbackOnTheWire = Extract<PersonalItemOnTheWire, { kind: 'FEEDBACK' }>;
type KudosCardOnTheWire = Extract<
  PersonalItemOnTheWire,
  { kind: 'KUDOS' }
>['card'];

const A_LOOK: NonNullable<FeedbackOnTheWire['postcard']> = {
  templateKey: 'system/postcard_template_2',
  tone: 'sage',
  textStyle: { font: 'classic', sizeStep: 3, align: 'center', ink: 'navy' },
  stickers: [],
  stampKey: 'system/stamp-02-ocean',
};

const AN_ANSWERS_LOOK: NonNullable<
  NonNullable<FeedbackOnTheWire['request']>['answerPostcard']
> = {
  textStyle: { font: 'signature', sizeStep: 2, align: 'left', ink: 'navy' },
  stickers: [],
};

function feedback(
  overrides: Partial<FeedbackOnTheWire> = {},
): PersonalItemOnTheWire {
  return {
    kind: 'FEEDBACK',
    id: 'feedback-1',
    origin: 'OFFERED',
    feedbackRequestId: null,
    giver: BEN,
    receivers: [ANN],
    message: 'The plan was clear.',
    tags: NO_TAGS,
    visibility: 'ONLY_ME',
    postcard: null,
    request: null,
    createdAt: SENT_ON,
    ...overrides,
  };
}

function kudos(card: KudosCardOnTheWire): PersonalItemOnTheWire {
  return {
    kind: 'KUDOS',
    id: 'kudos-1',
    giver: BEN,
    recipients: [ANN],
    message: 'Well done.',
    tags: NO_TAGS,
    card,
    createdAt: SENT_ON,
  };
}

describe('toPersonalItem', () => {
  it('keeps the look Feedback was written with', () => {
    const item = toPersonalItem(feedback({ postcard: A_LOOK }));

    expect(item).toMatchObject({
      kind: 'FEEDBACK',
      visibility: 'ONLY_ME',
      card: { kind: 'give', tone: 'sage', stampKey: A_LOOK.stampKey },
    });
  });

  it('puts Feedback not written on a postcard on a plain one', () => {
    const item = toPersonalItem(feedback());

    expect(item).toMatchObject({
      kind: 'FEEDBACK',
      card: {
        kind: 'give',
        tone: 'cream',
        templateKey: POSTCARD_TEMPLATES[0].key,
        textStyle: DEFAULT_TEXT_STYLE,
        stampKey: null,
      },
    });
  });

  it('draws an answer on its request’s card, in its own writing, on the right half', () => {
    const item = toPersonalItem(
      feedback({
        origin: 'REQUESTED',
        postcard: null,
        request: {
          message: 'How clear was the plan?',
          tags: NO_TAGS,
          requester: ANN,
          asked: [],
          postcard: A_LOOK,
          answerPostcard: AN_ANSWERS_LOOK,
        },
      }),
    );

    expect(item).toMatchObject({
      card: {
        kind: 'ask',
        ask: { message: 'How clear was the plan?', tone: 'sage' },
        answers: [
          {
            message: 'The plan was clear.',
            textStyle: AN_ANSWERS_LOOK.textStyle,
          },
        ],
      },
    });
  });

  it('leaves out Feedback with nobody to address the card to', () => {
    expect(toPersonalItem(feedback({ receivers: [] }))).toBeNull();
  });

  it('keeps a Kudos in the shape every Kudos is read in, on its card', () => {
    const item = toPersonalItem(
      kudos({
        templateKey: 'mint-breeze',
        textStyle: { font: 'classic', sizeStep: 2, align: 'left', ink: 'ink' },
        stickers: [],
      }),
    );

    expect(item).toMatchObject({
      kind: 'KUDOS',
      giver: { accountId: BEN.accountId, name: 'Ben Carter' },
      recipients: [{ name: 'Ann Lee' }],
      message: 'Well done.',
      givenAt: SENT_ON,
      drawing: { templateKey: 'mint-breeze' },
    });
  });
});
