import { describe, expect, it } from 'bun:test';
import { offerFeedbackRequestSchema, receiversOf } from './offer-feedback.dto';

const BEN = '0199a0f0-0000-7000-8000-00000000000b';
const CARA = '0199a0f0-0000-7000-8000-00000000000c';
const BODY = { message: 'You kept the room with you.', visibility: 'ONLY_ME' };

describe('who a body gives Feedback to', () => {
  it('takes several Receivers, in the order they were chosen', () => {
    const body = offerFeedbackRequestSchema.parse({
      ...BODY,
      receiverAccountIds: [CARA, BEN],
    });

    expect(receiversOf(body)).toEqual([CARA, BEN]);
  });

  it('still takes the one Receiver a page loaded before a deploy sends', () => {
    const body = offerFeedbackRequestSchema.parse({
      ...BODY,
      receiverAccountId: BEN,
    });

    expect(receiversOf(body)).toEqual([BEN]);
  });

  it('refuses a body that names nobody, or names them both ways', () => {
    expect(offerFeedbackRequestSchema.safeParse(BODY).success).toBe(false);
    expect(
      offerFeedbackRequestSchema.safeParse({
        ...BODY,
        receiverAccountId: BEN,
        receiverAccountIds: [CARA],
      }).success,
    ).toBe(false);
    expect(
      offerFeedbackRequestSchema.safeParse({ ...BODY, receiverAccountIds: [] })
        .success,
    ).toBe(false);
  });
});
