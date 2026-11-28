import type { GivenPostcard } from '@/components/organisms/postcard-dialog/postcard-read.type';
import { DEFAULT_TEXT_STYLE } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';

/**
 * Made-up Feedback that shows what each style looks like, the same card drawn both ways. Nobody in
 * a Workspace wrote it, so it names nobody real.
 */
export const FEEDBACK_STYLE_SAMPLE: GivenPostcard = {
  kind: 'give',
  giver: { name: 'Ann Lee', photoUrl: null },
  receivers: [{ name: 'Mali Sombat', photoUrl: null, inactive: false }],
  templateKey: 'system/postcard_template_3',
  stampKey: 'system/postcard_stamp_4',
  stickers: [],
  message:
    'You kept the room with you when the demo broke. Next time, say what you are fixing as you fix it, so nobody wonders.',
  messageTags: NO_TEXT_TAGS,
  tone: 'cream',
  textStyle: DEFAULT_TEXT_STYLE,
  sentOn: '2026-10-04T09:30:00.000Z',
};
