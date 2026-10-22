import { describe, expect, it } from 'bun:test';
import {
  AskAlreadyAnsweredError,
  CannotAskYourselfError,
  CannotSelectYourselfError,
  GiverAlreadyAskedError,
  NoGiversToAskError,
} from '../feedback-request.errors';
import { BoundTags } from '../value-object/bound-tags.vo';
import { FeedbackMessage } from '../value-object/feedback-message.vo';
import { RequestMessage } from '../value-object/request-message.vo';
import { Visibility } from '../value-object/visibility.vo';
import { FeedbackRequest, type GiverToAsk } from './feedback-request.entity';

const REQUEST_ID = '0199a0f0-0000-7000-8000-0000000000f1';
const ASK_ID = '0199a0f0-0000-7000-8000-0000000000a1';

function sending(
  overrides: {
    requester?: string;
    givers?: GiverToAsk[];
    visibility?: Visibility;
    tags?: BoundTags;
  } = {},
) {
  return {
    id: REQUEST_ID,
    workspaceId: '0199a0f0-0000-7000-8000-0000000000w1',
    requesterAccountId: overrides.requester ?? 'account-ann',
    message: RequestMessage.of('my presentation skills'),
    visibility: overrides.visibility ?? Visibility.onlyMe(),
    tags: overrides.tags ?? BoundTags.none(),
    givers: overrides.givers ?? [
      { askId: ASK_ID, giverAccountId: 'account-ben' },
    ],
  };
}

describe('sending a Feedback Request', () => {
  it('asks each Member named, and every Ask waits on its Giver', () => {
    const request = FeedbackRequest.send(sending());

    expect(request.snapshot()).toMatchObject({
      id: REQUEST_ID,
      requesterAccountId: 'account-ann',
      message: 'my presentation skills',
      visibility: 'ONLY_ME',
      selectedAccountIds: [],
      asks: [{ id: ASK_ID, giverAccountId: 'account-ben', status: 'PENDING' }],
    });
  });

  it('refuses a Requester asking themselves, who would answer their own question', () => {
    expect(() =>
      FeedbackRequest.send(
        sending({
          givers: [{ askId: ASK_ID, giverAccountId: 'account-ann' }],
        }),
      ),
    ).toThrow(CannotAskYourselfError);
  });

  it('refuses the same Giver twice, which would collect two answers to one question', () => {
    expect(() =>
      FeedbackRequest.send(
        sending({
          givers: [
            { askId: ASK_ID, giverAccountId: 'account-ben' },
            { askId: 'ask-2', giverAccountId: 'account-ben' },
          ],
        }),
      ),
    ).toThrow(GiverAlreadyAskedError);
  });

  it('refuses a request nobody was asked for', () => {
    expect(() => FeedbackRequest.send(sending({ givers: [] }))).toThrow(
      NoGiversToAskError,
    );
  });

  it('keeps who the Requester selected to read the answers', () => {
    const request = FeedbackRequest.send(
      sending({
        visibility: Visibility.of({
          value: 'SELECTED_PEOPLE',
          selectedAccountIds: ['account-cara'],
        }),
      }),
    );

    expect(request.snapshot()).toMatchObject({
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: ['account-cara'],
    });
  });

  it('refuses a Requester selecting themselves, who reads every answer already', () => {
    expect(() =>
      FeedbackRequest.send(
        sending({
          visibility: Visibility.of({
            value: 'SELECTED_PEOPLE',
            selectedAccountIds: ['account-ann'],
          }),
        }),
      ),
    ).toThrow(CannotSelectYourselfError);
  });

  it('rebuilds a stored request with its Asks, the people it was shared with and what its Request message names', () => {
    const stored = FeedbackRequest.send(
      sending({
        visibility: Visibility.of({
          value: 'SELECTED_PEOPLE',
          selectedAccountIds: ['account-cara'],
        }),
        tags: BoundTags.of({
          workspaceGoals: [{ workspaceGoalId: 'goal-1', name: 'ownership' }],
          mentions: [
            { accountId: 'account-cara', slug: 'cara', displayName: 'Cara' },
          ],
        }),
      }),
    ).snapshot();

    expect(FeedbackRequest.restore(stored).snapshot()).toEqual(stored);
  });

  describe('answering an Ask', () => {
    const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000e1';
    const answering = {
      askId: ASK_ID,
      giverAccountId: 'account-ben',
      feedbackId: FEEDBACK_ID,
      message: FeedbackMessage.of('You lose the room at the detail.'),
      tags: BoundTags.none(),
    };

    it('collects the Feedback for the Member who asked, not for whoever sent it', () => {
      const request = FeedbackRequest.send(sending());

      const feedback = request.answerAsk(answering);

      expect(feedback?.snapshot()).toEqual({
        id: FEEDBACK_ID,
        workspaceId: '0199a0f0-0000-7000-8000-0000000000w1',
        origin: 'REQUESTED',
        feedbackRequestId: REQUEST_ID,
        feedbackAskId: ASK_ID,
        giverAccountId: 'account-ben',
        receiverAccountId: 'account-ann',
        visibility: 'ONLY_ME',
        selectedAccountIds: [],
        message: 'You lose the room at the detail.',
        workspaceGoals: [],
        mentions: [],
      });
    });

    it('binds the answer to what its Giver wrote, never to what the Request message names', () => {
      const request = FeedbackRequest.send(
        sending({
          tags: BoundTags.of({
            workspaceGoals: [{ workspaceGoalId: 'goal-1', name: 'ownership' }],
            mentions: [],
          }),
        }),
      );

      const feedback = request.answerAsk({
        ...answering,
        tags: BoundTags.of({
          workspaceGoals: [{ workspaceGoalId: 'goal-2', name: 'ownershic' }],
          mentions: [],
        }),
      });

      expect(feedback?.snapshot().workspaceGoals).toEqual([
        { workspaceGoalId: 'goal-2', name: 'ownershic' },
      ]);
    });

    it('carries the people the Requester selected, so the answer is read as they chose', () => {
      const request = FeedbackRequest.send({
        ...sending(),
        visibility: Visibility.of({
          value: 'SELECTED_PEOPLE',
          selectedAccountIds: ['account-cara'],
        }),
      });

      const feedback = request.answerAsk(answering);

      expect(feedback?.snapshot()).toMatchObject({
        visibility: 'SELECTED_PEOPLE',
        selectedAccountIds: ['account-cara'],
      });
    });

    it('leaves the Ask answered, so it stops waiting', () => {
      const request = FeedbackRequest.send(sending());

      request.answerAsk(answering);

      expect(request.snapshot().asks).toEqual([
        { id: ASK_ID, giverAccountId: 'account-ben', status: 'ANSWERED' },
      ]);
    });

    it('refuses a second answer, because the first one is final', () => {
      const request = FeedbackRequest.send(sending());
      request.answerAsk(answering);

      expect(() => request.answerAsk(answering)).toThrow(
        AskAlreadyAnsweredError,
      );
    });

    it('answers nothing for an Ask this request does not hold', () => {
      const request = FeedbackRequest.send(sending());

      expect(
        request.answerAsk({ ...answering, askId: 'ask-elsewhere' }),
      ).toBeNull();
    });

    it('answers nothing for a Member the Ask is not waiting on', () => {
      const request = FeedbackRequest.send(sending());

      expect(
        request.answerAsk({ ...answering, giverAccountId: 'account-cara' }),
      ).toBeNull();
    });

    it('leaves the Ask waiting when it refuses to answer it', () => {
      const request = FeedbackRequest.send(sending());

      request.answerAsk({ ...answering, giverAccountId: 'account-cara' });

      expect(request.snapshot().asks[0]?.status).toBe('PENDING');
    });
  });
});
