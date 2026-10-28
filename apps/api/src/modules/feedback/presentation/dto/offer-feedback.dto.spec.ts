import { describe, expect, it } from 'bun:test';
import { offerFeedbackRequestSchema } from './offer-feedback.dto';

const BEN = '0199a0f0-0000-7000-8000-00000000000b';
const CARA = '0199a0f0-0000-7000-8000-00000000000c';
const BODY = { message: 'You kept the room with you.', visibility: 'ONLY_ME' };

describe('who a body gives Feedback to', () => {
  it('takes several Receivers, in the order they were chosen', () => {
    const body = offerFeedbackRequestSchema.parse({
      ...BODY,
      receiverAccountIds: [CARA, BEN],
    });

    expect(body.receiverAccountIds).toEqual([CARA, BEN]);
  });

  it('refuses the one-Receiver shape the route took before Feedback could have several', () => {
    expect(
      offerFeedbackRequestSchema.safeParse({ ...BODY, receiverAccountId: BEN })
        .success,
    ).toBe(false);
  });

  it('refuses a body that names nobody', () => {
    expect(offerFeedbackRequestSchema.safeParse(BODY).success).toBe(false);
    expect(
      offerFeedbackRequestSchema.safeParse({ ...BODY, receiverAccountIds: [] })
        .success,
    ).toBe(false);
  });
});
