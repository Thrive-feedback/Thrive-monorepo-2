import { describe, expect, it } from 'bun:test';
import {
  CannotGiveYourselfFeedbackError,
  CannotSelectTheReceiverError,
  CannotSelectYourselfError,
  MentionedPersonLeftOutError,
  NoReceiversError,
  ReceiverAlreadyNamedError,
} from '../feedback-request.errors';
import { BoundTags } from '../value-object/bound-tags.vo';
import { FeedbackMessage } from '../value-object/feedback-message.vo';
import { Visibility } from '../value-object/visibility.vo';
import { Feedback } from './feedback.entity';

const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000e1';
const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';

function offering(
  overrides: {
    giver?: string;
    receivers?: string[];
    visibility?: Visibility;
    mentions?: string[];
  } = {},
) {
  return {
    id: FEEDBACK_ID,
    workspaceId: WORKSPACE_ID,
    giverAccountId: overrides.giver ?? 'account-ann',
    receiverAccountIds: overrides.receivers ?? ['account-ben'],
    visibility: overrides.visibility ?? Visibility.onlyMe(),
    message: FeedbackMessage.of('You kept the room with you.'),
    tags: BoundTags.of({
      workspaceGoals: [],
      mentions: (overrides.mentions ?? []).map((accountId) => ({
        accountId,
        slug: accountId,
        displayName: accountId,
      })),
    }),
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
      receiverAccountIds: ['account-ben'],
      visibility: 'ONLY_ME',
      selectedAccountIds: [],
      message: 'You kept the room with you.',
      postcard: null,
      workspaceGoals: [],
      mentions: [],
    });
  });

  it('refuses a Giver giving themselves Feedback', () => {
    expect(() =>
      Feedback.offer(offering({ receivers: ['account-ann'] })),
    ).toThrow(CannotGiveYourselfFeedbackError);
  });

  it('is one piece of Feedback for several Receivers, in the order the Giver chose them', () => {
    const feedback = Feedback.offer(
      offering({ receivers: ['account-cara', 'account-ben'] }),
    );

    expect(feedback.snapshot().receiverAccountIds).toEqual([
      'account-cara',
      'account-ben',
    ]);
  });

  it('refuses Feedback for nobody', () => {
    expect(() => Feedback.offer(offering({ receivers: [] }))).toThrow(
      NoReceiversError,
    );
  });

  it('refuses naming one Receiver twice', () => {
    expect(() =>
      Feedback.offer(offering({ receivers: ['account-ben', 'account-ben'] })),
    ).toThrow(ReceiverAlreadyNamedError);
  });

  it('refuses the Giver among several Receivers', () => {
    expect(() =>
      Feedback.offer(offering({ receivers: ['account-ben', 'account-ann'] })),
    ).toThrow(CannotGiveYourselfFeedbackError);
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

  it('refuses selecting any one of several Receivers', () => {
    expect(() =>
      Feedback.offer(
        offering({
          receivers: ['account-ben', 'account-cara'],
          visibility: selecting('account-dan', 'account-cara'),
        }),
      ),
    ).toThrow(CannotSelectTheReceiverError);
  });

  it('refuses leaving out a Member the message mentions', () => {
    expect(() =>
      Feedback.offer(offering({ mentions: ['account-cara'] })),
    ).toThrow(MentionedPersonLeftOutError);
    expect(() =>
      Feedback.offer(
        offering({
          mentions: ['account-cara'],
          visibility: selecting('account-dan'),
        }),
      ),
    ).toThrow(MentionedPersonLeftOutError);
  });

  it('lets in a mentioned Member who is selected, or who reads it anyway', () => {
    for (const details of [
      offering({
        mentions: ['account-cara'],
        visibility: selecting('account-cara'),
      }),
      offering({
        mentions: ['account-cara'],
        visibility: Visibility.of({
          value: 'EVERYONE',
          selectedAccountIds: [],
        }),
      }),
      offering({ mentions: ['account-ann', 'account-ben'] }),
    ]) {
      expect(() => Feedback.offer(details)).not.toThrow();
    }
  });
});
