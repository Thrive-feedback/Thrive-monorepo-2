import { describe, expect, it } from 'bun:test';
import type { FeedbackView } from '../../application/types/feedback-request.types';
import { toFeedbackResponse } from './feedback-response.mapper';

const BEN = {
  accountId: 'account-ben',
  name: 'Ben Carter',
  photoUrl: null,
  status: 'ACTIVE',
} as const;
const CARA = { ...BEN, accountId: 'account-cara', name: 'Cara Diaz' };

const GIVEN_TO_TWO: FeedbackView = {
  id: 'feedback-1',
  origin: 'OFFERED',
  feedbackRequestId: null,
  giverAccountId: 'account-ann',
  giverName: 'Ann Lee',
  giverPhotoUrl: null,
  giverStatus: 'ACTIVE',
  receivers: [CARA, BEN],
  message: 'You two kept the demo calm.',
  tags: { workspaceGoals: [], mentions: [] },
  createdAt: new Date('2026-10-28T04:00:00.000Z'),
};

describe('a piece of Feedback on the wire', () => {
  it('names everyone it is for, in the order the Giver chose them', () => {
    expect(toFeedbackResponse(GIVEN_TO_TWO).receivers).toEqual([CARA, BEN]);
  });

  it('names nobody as its one Receiver: a piece can be for several', () => {
    expect(toFeedbackResponse(GIVEN_TO_TWO)).not.toHaveProperty('receiver');
  });
});
