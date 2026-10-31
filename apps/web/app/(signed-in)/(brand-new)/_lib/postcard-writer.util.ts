import { NO_NAME_STARTING_A_SENTENCE } from '@/components/organisms/feed-card/feed-card-sentence.util';
import type { PostcardWriter } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import { toFeedbackPerson } from '@/lib/feedback/feedback-person.util';

/** Who signs a card, from a person on the wire. */
export function toPostcardWriter(
  person: Parameters<typeof toFeedbackPerson>[0],
): PostcardWriter {
  const { name, photoUrl, inactive } = toFeedbackPerson(person);
  return { name: name ?? NO_NAME_STARTING_A_SENTENCE, photoUrl, inactive };
}
