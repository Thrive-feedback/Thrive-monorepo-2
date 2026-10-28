import type { components } from '@repo/api';
import type { AnsweredRequest } from './feed-item.type';
import { toFeedbackPerson } from './feedback-person.util';

/** The request an answer responds to, as every list that shows the answer sends it. */
type AnsweredRequestOnTheWire =
  components['schemas']['ListWorkspaceFeedResponseDto_Output']['items'][number]['request'];

/**
 * The request an answer responds to, as a card shows it, with whoever is reading named "you";
 * `null` for Feedback given without being asked.
 */
export function toAnsweredRequest(
  request: AnsweredRequestOnTheWire | null,
  viewerAccountId: string | null,
): AnsweredRequest | null {
  return (
    request && {
      message: request.message,
      messageTags: request.tags,
      requester: toFeedbackPerson(request.requester, viewerAccountId),
      asked: request.asked.map((person) =>
        toFeedbackPerson(person, viewerAccountId),
      ),
    }
  );
}
