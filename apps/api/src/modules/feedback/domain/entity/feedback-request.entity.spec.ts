import { describe, expect, it } from 'bun:test';
import {
  CannotAskYourselfError,
  GiverAlreadyAskedError,
  NoGiversToAskError,
} from '../feedback-request.errors';
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
});
