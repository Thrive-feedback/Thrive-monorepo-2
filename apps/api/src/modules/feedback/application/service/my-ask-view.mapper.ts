import { AskStatus } from '../../domain/value-object/ask-status.vo';
import type { FeedbackAskRow } from '../query-port/feedback-request.query-port';
import type { MyAskView } from '../types/feedback-request.types';
import type { PeopleService } from './people.service';

type People = Awaited<ReturnType<PeopleService['peopleIn']>>;

/** One Ask as the Member asked reads it, in a list, naming who asked. */
export function toMyAskView(ask: FeedbackAskRow, people: People): MyAskView {
  return {
    askId: ask.askId,
    feedbackRequestId: ask.feedbackRequestId,
    message: ask.message,
    tags: ask.tags,
    requesterAccountId: ask.requesterAccountId,
    // The Requester's Account cascades away with them, as a Giver's does.
    requesterName: people.nameOf(ask.requesterAccountId),
    requesterPhotoUrl: people.photoOf(ask.requesterAccountId),
    requesterStatus: people.statusOf(ask.requesterAccountId),
    status: AskStatus.of(ask.status).toString(),
    createdAt: ask.createdAt,
  };
}
