import type { VisibilityValue } from '@app/modules/feedback/domain/value-object/visibility.vo';
import {
  FakeFeedbackRequestQuery,
  FakeKudosQuery,
  NO_TAGS,
} from './feedback.fakes';

export const BETWEEN_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const OTHER_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w2';
export const ANN = 'account-ann';
export const BEN = 'account-ben';
export const CARA = 'account-cara';
export const DAN = 'account-dan';

/** Day `day` of October 2026, which is when each piece below was written. */
export function onDay(day: number) {
  return new Date(`2026-10-${day}T03:00:00.000Z`);
}

/** A piece as its Giver's list holds it, with who may read each answer beside it. */
function writtenRow(
  id: string,
  day: number,
  giverAccountId: string,
  receiverAccountIds: readonly string[],
  visibility: VisibilityValue,
  workspaceId = BETWEEN_WORKSPACE_ID,
) {
  return {
    workspaceId,
    id,
    origin: 'OFFERED',
    feedbackRequestId: null,
    giverAccountId,
    receiverAccountIds,
    message: `Feedback ${id}`,
    tags: NO_TAGS,
    visibility,
    postcard: null,
    request: null,
    createdAt: onDay(day),
  } as const;
}

/** Dan's answer to Ann's request, which also asked Cara, kept to Ben besides the two of them. */
function answerBesideCaras(id: string, day: number) {
  const audience = {
    visibility: 'SELECTED_PEOPLE',
    selectedAccountIds: [BEN],
  } as const;
  const answered = (giverAccountId: string) => ({
    giverAccountId,
    status: 'ANSWERED',
    answer: {
      message: `${giverAccountId} answered`,
      tags: NO_TAGS,
      answeredAt: onDay(day),
    },
    answerAudience: audience,
  });
  return {
    ...writtenRow(id, day, DAN, [ANN], 'SELECTED_PEOPLE'),
    origin: 'REQUESTED',
    feedbackRequestId: `request-${id}`,
    request: {
      message: 'How was the launch?',
      tags: NO_TAGS,
      requesterAccountId: ANN,
      asks: [answered(DAN), answered(CARA)],
      postcard: null,
      answerPostcard: null,
    },
  } as const;
}

function requestRow(
  id: string,
  day: number,
  requesterAccountId: string,
  giverAccountId: string,
  status: 'PENDING' | 'ANSWERED' = 'PENDING',
) {
  return {
    workspaceId: BETWEEN_WORKSPACE_ID,
    id: `request-${id}`,
    requesterAccountId,
    message: `Request ${id}`,
    postcard: null,
    tags: NO_TAGS,
    visibility: 'ONLY_ME',
    selectedAccountIds: [],
    asks: [{ askId: id, giverAccountId, status }],
    createdAt: onDay(day),
  };
}

function kudosRow(
  id: string,
  day: number,
  giverAccountId: string,
  recipientAccountIds: readonly string[],
  workspaceId = BETWEEN_WORKSPACE_ID,
) {
  return {
    workspaceId,
    id,
    giverAccountId,
    recipientAccountIds,
    message: `Kudos ${id}`,
    tags: NO_TAGS,
    card: null,
    createdAt: onDay(day),
  };
}

/**
 * What was written by, to and between four people, for Dan reading Ann's Profile. Between them:
 * Feedback either way at every Visibility, Feedback and Kudos Ben wrote to both, an answer beside
 * Cara's, and Kudos either way. Not between them: what went to only one of them, an Ask Ben sent, an
 * answered Ask, and another Workspace's. Two Asks are open between them.
 */
export function betweenDanAndAnn() {
  const feedbackRequestQuery = new FakeFeedbackRequestQuery();
  feedbackRequestQuery.givenItems.push(
    writtenRow('dan-to-ann-only', 11, DAN, [ANN], 'ONLY_ME'),
    writtenRow('ann-to-dan-only', 12, ANN, [DAN], 'ONLY_ME'),
    writtenRow('ben-to-both', 14, BEN, [ANN, DAN], 'EVERYONE'),
    writtenRow('ben-to-ann', 15, BEN, [ANN], 'EVERYONE'),
    writtenRow('dan-to-ann-and-cara', 16, DAN, [ANN, CARA], 'SELECTED_PEOPLE'),
    answerBesideCaras('dan-answers-ann', 17),
    writtenRow('ben-to-dan', 18, BEN, [DAN], 'ONLY_ME'),
    writtenRow('elsewhere', 22, DAN, [ANN], 'EVERYONE', OTHER_WORKSPACE_ID),
  );
  feedbackRequestQuery.rows.push(
    requestRow('ask-answered', 9, DAN, ANN, 'ANSWERED'),
    requestRow('ask-ann-dan', 19, ANN, DAN),
    requestRow('ask-dan-ann', 20, DAN, ANN),
    requestRow('ask-ben-ann', 21, BEN, ANN),
  );
  const kudosQuery = new FakeKudosQuery();
  kudosQuery.rows.push(
    kudosRow('kudos-ben-to-ann', 13, BEN, [ANN]),
    kudosRow('kudos-dan-to-ann', 23, DAN, [ANN]),
    kudosRow('kudos-ann-to-dan', 24, ANN, [DAN]),
    kudosRow('kudos-ben-to-both', 25, BEN, [ANN, DAN]),
    kudosRow('kudos-elsewhere', 26, DAN, [ANN], OTHER_WORKSPACE_ID),
  );
  return { feedbackRequestQuery, kudosQuery };
}
