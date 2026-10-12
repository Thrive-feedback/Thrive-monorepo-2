import { describe, expect, it } from 'bun:test';
import {
  AskAlreadyAnsweredError,
  CannotAskYourselfError,
  GiverAlreadyAskedError,
  NoGiversToAskError,
} from '../feedback-request.errors';
import { FeedbackBody } from '../value-object/feedback-body.vo';
import { Topic } from '../value-object/topic.vo';
import { Visibility } from '../value-object/visibility.vo';
import { FeedbackRequest, type GiverToAsk } from './feedback-request.entity';

const REQUEST_ID = '0199a0f0-0000-7000-8000-0000000000f1';
const ASK_ID = '0199a0f0-0000-7000-8000-0000000000a1';

function sending(
  overrides: { requester?: string; givers?: GiverToAsk[] } = {},
) {
  return {
    id: REQUEST_ID,
    workspaceId: '0199a0f0-0000-7000-8000-0000000000w1',
    requesterAccountId: overrides.requester ?? 'account-ann',
    topic: Topic.of('my presentation skills'),
    visibility: Visibility.onlyMe(),
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
      topic: 'my presentation skills',
      visibility: 'ONLY_ME',
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

  it('rebuilds a stored request with its Asks', () => {
    const stored = FeedbackRequest.send(sending()).snapshot();

    expect(FeedbackRequest.restore(stored).snapshot()).toEqual(stored);
  });

  describe('answering an Ask', () => {
    const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000e1';
    const answering = {
      askId: ASK_ID,
      giverAccountId: 'account-ben',
      feedbackId: FEEDBACK_ID,
      body: FeedbackBody.of('You lose the room at the detail.'),
    };

    it('collects the Feedback for the Member who asked, not for whoever sent it', () => {
      const request = FeedbackRequest.send(sending());

      const feedback = request.answerAsk(answering);

      expect(feedback?.snapshot()).toEqual({
        id: FEEDBACK_ID,
        workspaceId: '0199a0f0-0000-7000-8000-0000000000w1',
        feedbackRequestId: REQUEST_ID,
        feedbackAskId: ASK_ID,
        giverAccountId: 'account-ben',
        receiverAccountId: 'account-ann',
        body: 'You lose the room at the detail.',
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
