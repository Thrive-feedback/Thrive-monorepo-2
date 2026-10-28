import { GlobeIcon, LockIcon, UsersIcon } from 'lucide-react';
import { Text } from '@/components/atoms/text';
import type { SentRequestReaders } from '@/lib/feedback/sent-request.type';
import { PersonNameList } from './person-name-list';

const ICONS = {
  ONLY_ME: LockIcon,
  SELECTED_PEOPLE: UsersIcon,
  EVERYONE: GlobeIcon,
} as const;

export type AnswerReadersProps = {
  /** Who besides the person who asked reads the answers, as the request was sent. */
  readers: SentRequestReaders;
  /** Lead the sentence with the Visibility's icon, as a card does. */
  withIcon?: boolean;
};

/**
 * Who reads what comes back from a request, in the words the form used when it was sent. Only
 * ever shown to the person who asked: a Giver is not told who else reads (`ADR-0022` in the
 * brain).
 */
export function AnswerReaders({
  readers,
  withIcon = false,
}: AnswerReadersProps) {
  const Icon = ICONS[readers.value];
  return (
    <Text
      as="p"
      variant="body-3"
      tone="muted"
      className="flex items-start gap-1.5"
    >
      {withIcon && (
        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      )}
      <span className="min-w-0 break-words">
        {readers.value === 'ONLY_ME' &&
          'Only you can read what they send back.'}
        {readers.value === 'EVERYONE' &&
          'Everyone in your Workspace can read what they send back.'}
        {readers.value === 'SELECTED_PEOPLE' && (
          <>
            You and{' '}
            <PersonNameList
              people={readers.selectedPeople}
              unnamed="a teammate"
            />{' '}
            can read what they send back.
          </>
        )}
      </span>
    </Text>
  );
}
