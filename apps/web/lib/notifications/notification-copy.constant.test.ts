import { describe, expect, it } from 'vitest';
import type { NotificationType } from './notification.type';
import {
  NOTIFICATION_LINES,
  notificationLine,
} from './notification-copy.constant';

const SUBJECT = '0199ffff-0000-7000-8000-00000000000a';

/**
 * Every kind the API can send, with what a person reads and where it takes them. A fifth kind
 * cannot be added to the copy without arriving here first: the next test compares this list
 * with the map, key for key.
 */
const LINES: readonly (readonly [NotificationType, string, string])[] = [
  [
    'ASK_RECEIVED',
    'Ploy asked you for feedback',
    `/home?tab=waiting&ask=${SUBJECT}`,
  ],
  [
    'ASK_ANSWERED',
    'Ploy answered your request',
    `/home?tab=my-requests&request=${SUBJECT}`,
  ],
  [
    'FEEDBACK_RECEIVED',
    'Ploy wrote feedback to you',
    `/home?feedback=${SUBJECT}`,
  ],
  [
    'FEEDBACK_SHARED',
    'Ploy shared feedback with you',
    `/home?feedback=${SUBJECT}`,
  ],
];

describe('notificationLine', () => {
  it('covers every kind the API can send, and nothing it cannot', () => {
    expect(Object.keys(NOTIFICATION_LINES)).toEqual(
      LINES.map(([type]) => type),
    );
  });

  it.each(LINES)(
    '%s reads "%s" and opens what it names',
    (type, sentence, destination) => {
      expect(
        notificationLine({ type, actorName: 'Ploy', subjectId: SUBJECT }),
      ).toEqual({ sentence, destination });
    },
  );

  it.each(LINES)(
    '%s still reads as a sentence when nobody can be named',
    (type, sentence) => {
      const line = notificationLine({
        type,
        actorName: null,
        subjectId: SUBJECT,
      });

      expect(line.sentence).toBe(sentence.replace('Ploy', 'Somebody'));
    },
  );

  it('treats a blank name as no name, rather than starting a sentence with a space', () => {
    const line = notificationLine({
      type: 'ASK_RECEIVED',
      actorName: '   ',
      subjectId: SUBJECT,
    });

    expect(line.sentence).toBe('Somebody asked you for feedback');
  });
});
