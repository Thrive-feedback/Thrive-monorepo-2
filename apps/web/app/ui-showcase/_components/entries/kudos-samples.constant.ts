import type { ReadKudos } from '@/components/organisms/kudos-dialog/read-kudos.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { SAMPLE_READER } from './feed-card-samples.constant';

const person = (
  accountId: string,
  name: string,
  photoUrl: string | null = null,
) => ({
  accountId,
  name,
  photoUrl,
  inactive: false,
});

const MALI = person('mali', 'Mali Chaiyo');
const BEN = person('ben', 'Ben Wong');
const DAO = person('dao', 'Dao Prasert');
const NOK = person('nok', 'Nok Wattana');
const CHAI = person('chai', 'Chai Srisuk');
const THE_READER = person(SAMPLE_READER, 'Ann Lee');

const GIVEN_AT = '2026-10-31T03:00:00.000Z';

/** A Kudos to one teammate, with a sticker, as most are. */
export const SAMPLE_KUDOS: ReadKudos = {
  id: '0199a0f0-0000-7000-8000-000000000k01',
  giver: MALI,
  recipients: [BEN],
  message:
    'Thank you for jumping in on the release notes. Friday felt calm because of you.',
  messageTags: NO_TEXT_TAGS,
  givenAt: GIVEN_AT,
  drawing: {
    templateKey: 'cobalt-dash',
    textStyle: {
      font: 'signature',
      sizeStep: 4,
      align: 'center',
      ink: 'paper',
    },
    stickers: [
      {
        stickerKey: 'system/sticker-01-thumbs-up',
        x: 72,
        y: 80,
        scale: 1,
        rotation: 8,
        side: 'back',
      },
    ],
  },
};

/** A Kudos to whoever reads it, on another template. */
export const SAMPLE_KUDOS_TO_THE_READER: ReadKudos = {
  ...SAMPLE_KUDOS,
  id: '0199a0f0-0000-7000-8000-000000000k02',
  recipients: [THE_READER],
  message: 'You turned a messy brief into a clear plan in one afternoon.',
  drawing: {
    templateKey: 'peach-pop',
    textStyle: {
      font: 'classic',
      sizeStep: 4,
      align: 'center',
      ink: 'ink',
    },
    stickers: [],
  },
};

/** Every way a Kudos can be addressed, and the longest it can be. */
export const KUDOS_CASES: readonly { label: string; kudos: ReadKudos }[] = [
  { label: 'To one teammate', kudos: SAMPLE_KUDOS },
  { label: 'To the reader', kudos: SAMPLE_KUDOS_TO_THE_READER },
  {
    label: 'To several people',
    kudos: {
      ...SAMPLE_KUDOS,
      id: '0199a0f0-0000-7000-8000-000000000k03',
      recipients: [BEN, DAO, NOK, CHAI],
      message: 'The launch checklist you wrote saved us twice this week.',
      drawing: {
        templateKey: 'sunny-check',
        textStyle: { font: 'modern', sizeStep: 4, align: 'center', ink: 'ink' },
        stickers: [],
      },
    },
  },
  {
    label: 'To the whole Workspace',
    kudos: {
      ...SAMPLE_KUDOS,
      id: '0199a0f0-0000-7000-8000-000000000k04',
      recipients: [],
      message: 'Great launch, everyone.',
      drawing: {
        templateKey: 'mint-breeze',
        textStyle: {
          font: 'modern',
          sizeStep: 4,
          align: 'center',
          ink: 'forest',
        },
        stickers: [],
      },
    },
  },
  {
    label: 'The longest it can be',
    kudos: {
      ...SAMPLE_KUDOS,
      id: '0199a0f0-0000-7000-8000-000000000k05',
      message:
        'You stayed with the client until the whole thing was sorted, rewrote the handover in one afternoon, and still found time to walk the new people through it. Friday felt calm because of you, and everyone on the team noticed it. Thank you for all of it, truly, from all of us.',
      drawing: {
        templateKey: 'red-squiggle',
        textStyle: {
          font: 'signature',
          sizeStep: 4,
          align: 'center',
          ink: 'ink',
        },
        stickers: [],
      },
    },
  },
];
