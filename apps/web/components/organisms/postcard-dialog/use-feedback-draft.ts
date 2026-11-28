import { useCallback, useMemo, useReducer } from 'react';
import { feedbackTagTriggers } from '@/components/organisms/feedback-tag-triggers.util';
import { SELECTED_PEOPLE } from '@/components/organisms/visibility-picker';
import { chosenPeople } from '@/lib/feedback/chosen-people.util';
import { useMentionedAudience } from '@/lib/feedback/use-mentioned-audience';
import type { PostcardCard, WrittenSoFar } from './postcard-draft.type';
import { applyChange, blankDraft } from './postcard-draft.util';

function isSameList(one: readonly string[], other: readonly string[]) {
  return (
    one.length === other.length && one.every((item) => other.includes(item))
  );
}

/**
 * Everything written on one opening of the writing dialog, whichever style it is written in: the
 * draft, who else can read it as the text's Mentions decide, who can be picked, and what Send hands
 * over. The postcard and the plain sheet are two faces of this one draft, so a rule changed here
 * holds for both.
 *
 * `openingRecipientAccountIds` is who the caller addressed it to, before any switch of style carried
 * a choice over, so a switch does not count the writer's own choice as the caller's.
 */
export function useFeedbackDraft(
  card: PostcardCard,
  openingRecipientAccountIds: readonly string[],
) {
  const [draft, change] = useReducer(applyChange, card, blankDraft);
  const { kind, teammates, workspaceGoals } = card;

  // The same rules as the composer on Home: who the text mentions decides who can read it.
  const audience = useMentionedAudience({
    message: draft.message,
    teammates,
    readsAnyway: draft.recipientAccountIds,
    initial: card.kind === 'answer' ? undefined : card.defaultAudience,
  });
  const triggers = useMemo(
    () => feedbackTagTriggers(workspaceGoals, teammates),
    [workspaceGoals, teammates],
  );

  // Who can be picked under Selected people. Whoever Feedback is for reads it anyway, so they are
  // not among them; the people asked can be, because selecting one lets them read the others'
  // answers, which is the Requester's call.
  const people = useMemo(
    () =>
      kind === 'give'
        ? teammates.filter(
            (teammate) =>
              !draft.recipientAccountIds.includes(teammate.accountId),
          )
        : teammates,
    [kind, teammates, draft.recipientAccountIds],
  );
  // The people picked who still count: none under any other choice, and only who can be picked.
  const selectedReaders: ReadonlySet<string> = new Set(
    audience.visibility === SELECTED_PEOPLE
      ? people
          .filter((person) => audience.selectedAccountIds.has(person.accountId))
          .map((person) => person.accountId)
      : [],
  );
  const recipientNames = useMemo(
    () =>
      chosenPeople(teammates, draft.recipientAccountIds).map(
        (person) => person.name,
      ),
    [teammates, draft.recipientAccountIds],
  );

  const handleRecipientsChange = useCallback(
    (recipientAccountIds: readonly string[]) =>
      change({ kind: 'card', fields: { recipientAccountIds } }),
    [],
  );

  function changeMessage(message: string) {
    audience.noteMessage(message);
    change({ kind: 'card', fields: { message } });
  }

  /** Everything on it, to the caller's `onSend`: an answer is its words alone. */
  function handOver() {
    return card.kind === 'answer'
      ? card.onSend({
          message: draft.message,
          stickers: draft.stickers,
          textStyle: draft.textStyle,
        })
      : card.onSend({
          ...draft,
          visibility: audience.visibility,
          selectedAccountIds: selectedReaders,
        });
  }

  /** What a switch of style carries to the other one. */
  function writtenSoFar(): WrittenSoFar {
    return {
      message: draft.message,
      recipientAccountIds: draft.recipientAccountIds,
      audience: audience.kept,
    };
  }

  // The words and the people, beyond who the caller already chose it was for; how a postcard looks
  // is the postcard's own to add.
  const hasWrittenWords =
    draft.message.trim() !== '' ||
    !isSameList(draft.recipientAccountIds, openingRecipientAccountIds) ||
    selectedReaders.size > 0;

  // Who else can read it, as the box beside Send offers it; an answer has no such choice.
  const visibilityToolProps =
    card.kind === 'answer'
      ? null
      : {
          kind: card.kind,
          value: audience.visibility,
          people,
          selectedAccountIds: audience.selectedAccountIds,
          recipientNames,
          note: audience.notice ?? audience.lockedReason,
          isOnlyMeDisabled: audience.onlyMeDisabled,
          lockedPeople: audience.lockedPeople,
          onValueChange: audience.choose,
          onSelectedChange: audience.select,
        };

  return {
    draft,
    change,
    visibilityToolProps,
    audience,
    triggers,
    people,
    selectedReaders,
    recipientNames,
    handleRecipientsChange,
    changeMessage,
    handOver,
    writtenSoFar,
    hasWrittenWords,
  };
}
