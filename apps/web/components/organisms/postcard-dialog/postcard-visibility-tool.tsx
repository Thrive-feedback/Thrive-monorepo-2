import { useState } from 'react';
import { VisibilityMenu } from '@/components/organisms/visibility-menu';
import { SELECTED_PEOPLE } from '@/components/organisms/visibility-picker';
import type { Teammate } from '@/lib/feedback/teammate.type';
import type { PostcardVisibility } from './postcard-draft.type';

const listFormat = new Intl.ListFormat('en', { type: 'conjunction' });

/**
 * The Visibilities by the names each card gives them: whoever Feedback is given to always reads
 * it, so the Giver's narrowest choice is "Only them"; the Requester's is "Only me".
 */
const VISIBILITY_LABELS: Readonly<
  Record<'give' | 'ask', Record<PostcardVisibility, string>>
> = {
  give: {
    ONLY_ME: 'Only them',
    SELECTED_PEOPLE: 'Selected people',
    EVERYONE: 'Everyone in the Workspace',
  },
  ask: {
    ONLY_ME: 'Only me',
    SELECTED_PEOPLE: 'Selected people',
    EVERYONE: 'Everyone in the Workspace',
  },
};

const VISIBILITY_ORDER: readonly PostcardVisibility[] = [
  'ONLY_ME',
  SELECTED_PEOPLE,
  'EVERYONE',
];

const ONLY_ME: ReadonlySet<PostcardVisibility> = new Set(['ONLY_ME']);

/** What each choice means, by name, with the warning that it is final. */
function visibilityMeaning(
  kind: 'give' | 'ask',
  visibility: PostcardVisibility,
  recipientNames: readonly string[],
) {
  if (kind === 'ask') {
    const meaning = {
      ONLY_ME: 'You and whoever wrote the answer.',
      [SELECTED_PEOPLE]:
        'You, whoever wrote the answer, and the people you choose. They see it in the Feed.',
      EVERYONE: 'Answers appear in the Feed for every Member.',
    }[visibility];
    return `${meaning} Every answer shows who wrote it. You can't change this after you send.`;
  }
  const them =
    recipientNames.length > 0 ? recipientNames : ['the person you choose'];
  const meaning = {
    ONLY_ME: `${listFormat.format(['You', ...them])}.`,
    [SELECTED_PEOPLE]: `${listFormat.format(['You', ...them, 'the people you choose'])}. They see it in the Feed.`,
    EVERYONE: `It appears in the Feed for every Member, with your name and ${listFormat.format(them)}.`,
  }[visibility];
  return `${meaning} You can't change this after you send.`;
}

export type PostcardVisibilityToolProps = {
  kind: 'give' | 'ask';
  value: PostcardVisibility;
  /** Who can be picked under Selected people. */
  people: readonly Teammate[];
  selectedAccountIds: ReadonlySet<string>;
  /** Who the postcard is for, by name: they always read it, and the choices say so. */
  recipientNames: readonly string[];
  /** What a Mention did to the choice, or why it limits it, said above what the choice means. */
  note: string | null;
  /** Only me leaves out somebody the message mentions, so it cannot be chosen. */
  isOnlyMeDisabled: boolean;
  /** People a Mention keeps selected, each with the reason shown. */
  lockedPeople: ReadonlyMap<string, string>;
  onValueChange: (visibility: PostcardVisibility) => void;
  onSelectedChange: (accountIds: ReadonlySet<string>) => void;
};

/** Who else can read the card, on the bar of whichever side is showing. */
export function PostcardVisibilityTool({
  kind,
  value,
  people,
  selectedAccountIds,
  recipientNames,
  note,
  isOnlyMeDisabled,
  lockedPeople,
  onValueChange,
  onSelectedChange,
}: PostcardVisibilityToolProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <VisibilityMenu
      options={VISIBILITY_ORDER.map((option) => ({
        value: option,
        label: VISIBILITY_LABELS[kind][option],
      }))}
      value={value}
      people={people}
      selectedAccountIds={selectedAccountIds}
      helperText={
        <>
          {note} {visibilityMeaning(kind, value, recipientNames)}
        </>
      }
      peopleDescription={
        kind === 'ask'
          ? 'You and whoever wrote an answer can always read it.'
          : `${recipientNames.length > 0 ? listFormat.format(recipientNames) : 'Whoever it is for'} and you can always read it.`
      }
      open={isOpen}
      onOpenChange={setIsOpen}
      onValueChange={onValueChange}
      onSelectedChange={onSelectedChange}
      disabledValues={isOnlyMeDisabled ? ONLY_ME : undefined}
      lockedPeople={lockedPeople}
    />
  );
}
