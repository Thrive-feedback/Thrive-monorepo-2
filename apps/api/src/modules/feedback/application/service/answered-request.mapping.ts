import type { AnsweredRequestRow } from '../query-port/feedback-request.query-port';
import type {
  AnsweredRequestView,
  People,
} from '../types/feedback-request.types';

/**
 * Everyone the request an answer responds to names — its Requester and everyone it asked — so a
 * list can look them up in the one `peopleIn` call it already makes. Nobody for Offered Feedback.
 */
export function accountIdsInRequest(
  request: AnsweredRequestRow | null,
): readonly string[] {
  return request
    ? [request.requesterAccountId, ...request.askedAccountIds]
    : [];
}

/**
 * The request an answer responds to, with everyone it names. The same on every list that shows
 * an answer (brain `ADR-0046`, `ADR-0048`), so a card means one thing wherever it appears.
 */
export function toAnsweredRequestView(
  request: AnsweredRequestRow | null,
  people: People,
): AnsweredRequestView | null {
  return (
    request && {
      message: request.message,
      tags: request.tags,
      requester: people.personOf(request.requesterAccountId),
      asked: request.askedAccountIds.map(people.personOf),
    }
  );
}
