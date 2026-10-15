import { describe, expect, it } from 'bun:test';
import {
  CannotGiveYourselfFeedbackError,
  CannotSelectTheReceiverError,
  CannotSelectYourselfError,
} from '../feedback-request.errors';
import { FeedbackBody } from '../value-object/feedback-body.vo';
import { Topic } from '../value-object/topic.vo';
import { Visibility } from '../value-object/visibility.vo';
import { Feedback } from './feedback.entity';

const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000e1';
const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';

function offering(
  overrides: {
    giver?: string;
    receiver?: string;
    visibility?: Visibility;
  } = {},
) {
  return {
    id: FEEDBACK_ID,
    workspaceId: WORKSPACE_ID,
    giverAccountId: overrides.giver ?? 'account-ann',
    receiverAccountId: overrides.receiver ?? 'account-ben',
    topic: Topic.of('the customer demo'),
    visibility: overrides.visibility ?? Visibility.onlyMe(),
    body: FeedbackBody.of('You kept the room with you.'),
  };
}

function selecting(...accountIds: string[]): Visibility {
  return Visibility.of({
    value: 'SELECTED_PEOPLE',
    selectedAccountIds: accountIds,
  });
}

describe('offering Feedback without being asked', () => {
  it('is Feedback from the Giver to the Receiver, with no request and no Ask', () => {
    const feedback = Feedback.offer(offering());

    expect(feedback.snapshot()).toEqual({
      id: FEEDBACK_ID,
      workspaceId: WORKSPACE_ID,
      origin: 'OFFERED',
      feedbackRequestId: null,
      feedbackAskId: null,
      giverAccountId: 'account-ann',
      receiverAccountId: 'account-ben',
      topic: 'the customer demo',
      visibility: 'ONLY_ME',
      selectedAccountIds: [],
      body: 'You kept the room with you.',
    });
  });

  it('refuses a Giver giving themselves Feedback', () => {
    expect(() => Feedback.offer(offering({ receiver: 'account-ann' }))).toThrow(
      CannotGiveYourselfFeedbackError,
    );
  });

  it('keeps the people the Giver selected to read it', () => {
    const feedback = Feedback.offer(
      offering({ visibility: selecting('account-cara') }),
    );

    expect(feedback.snapshot()).toMatchObject({
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: ['account-cara'],
    });
  });

  it('refuses the Giver selecting themselves, who reads it anyway', () => {
    expect(() =>
      Feedback.offer(offering({ visibility: selecting('account-ann') })),
    ).toThrow(CannotSelectYourselfError);
  });

  it('refuses selecting the Receiver, who reads it anyway', () => {
    expect(() =>
      Feedback.offer(offering({ visibility: selecting('account-ben') })),
    ).toThrow(CannotSelectTheReceiverError);
  });
});
