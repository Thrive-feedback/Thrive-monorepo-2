import { GlobeIcon, LockIcon, UsersIcon } from 'lucide-react';
import type {
  PersonalRequest,
  PersonalRequestAsk,
} from '@/app/(signed-in)/(brand-new)/_lib/personal-item.type';
import { NO_NAME_IN_A_SENTENCE } from '@/components/organisms/feed-card/feed-card-sentence.util';

/** Who can read the answers to a request, as its Requester chose, in their own words. */
const AUDIENCES: Readonly<
  Record<
    PersonalRequest['visibility'],
    { label: string; Icon: typeof GlobeIcon }
  >
> = {
  ONLY_ME: { label: 'Only you', Icon: LockIcon },
  SELECTED_PEOPLE: { label: 'Selected people', Icon: UsersIcon },
  EVERYONE: { label: 'Everyone', Icon: GlobeIcon },
};

export function requestAudienceOf(visibility: PersonalRequest['visibility']) {
  return AUDIENCES[visibility];
}

/** "You asked Ben Wong", or "You asked 3 people". */
export function askedLine({ asked }: Pick<PersonalRequest, 'asked'>) {
  const [only] = asked;
  if (asked.length === 1 && only) {
    return `You asked ${only.person.name ?? NO_NAME_IN_A_SENTENCE}`;
  }
  return `You asked ${asked.length} people`;
}

/** How many of those asked have answered, of how many. */
export function tallyOf({ asked }: Pick<PersonalRequest, 'asked'>) {
  return {
    answered: asked.filter((ask) => ask.status === 'ANSWERED').length,
    asked: asked.length,
  };
}

type Answered = PersonalRequestAsk & {
  answer: NonNullable<PersonalRequestAsk['answer']>;
};

function isAnswered(ask: PersonalRequestAsk): ask is Answered {
  return ask.answer !== null;
}

/**
 * The answers newest first, then those still Pending in alphabetical order, never by how long they
 * have waited (design FB-4-S4).
 */
export function answeredFirst({ asked }: Pick<PersonalRequest, 'asked'>) {
  return {
    answers: asked
      .filter(isAnswered)
      .sort((a, b) => b.answer.answeredAt.localeCompare(a.answer.answeredAt)),
    pending: asked
      .filter((ask) => !isAnswered(ask))
      .sort((a, b) => (a.person.name ?? '').localeCompare(b.person.name ?? '')),
  };
}

/** The newest answer, which is what a request's tile opens, or `null` while nobody has answered. */
export function newestAnswerOf(request: Pick<PersonalRequest, 'asked'>) {
  return answeredFirst(request).answers[0]?.answer ?? null;
}
