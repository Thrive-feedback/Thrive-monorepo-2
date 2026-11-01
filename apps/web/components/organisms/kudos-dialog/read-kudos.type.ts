import type { FeedbackPerson } from '@/lib/feedback/feedback-person.util';
import type { KudosItem } from '@/lib/feedback/kudos-item.type';
import type { KudosCardDrawing } from './kudos-card-read-only';

/** Somebody a Kudos names, with what tells a reader they are looking at themselves. */
export type ReadKudosPerson = FeedbackPerson & {
  readonly accountId: string;
};

/** One sent Kudos, with the card it is drawn on, wherever it is read. */
export type ReadKudos = Omit<KudosItem, 'giver' | 'recipients'> & {
  readonly giver: ReadKudosPerson;
  /** Everyone it names. None: it is for the whole Workspace. */
  readonly recipients: readonly ReadKudosPerson[];
  readonly drawing: KudosCardDrawing;
};
