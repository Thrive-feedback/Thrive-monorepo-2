import { useState } from 'react';
import { mentionedTeammates } from '@/lib/feedback/mentioned-teammates.util';
import type { Teammate } from '@/lib/feedback/teammate.type';

const names = new Intl.ListFormat('en', { type: 'conjunction' });

/** What the people dialog says under someone a Mention keeps selected. */
const MENTIONED = 'Mentioned in your message';

/** The Visibility values the hook has to tell apart; the forms name the rest of theirs. */
type AudienceValue = 'ONLY_ME' | 'SELECTED_PEOPLE' | 'EVERYONE';

/**
 * Who reads a Request message or Offered Feedback, kept in step with who its text mentions (brain
 * `ADR-0047`). Mentioning a teammate who would not read it otherwise — a "mentioned outsider" —
 * means they can:
 *
 * - while one is mentioned, Only me cannot be chosen, and choosing it earlier becomes Selected
 *   people, with a notice saying why — it does not go back when the `@` is deleted;
 * - in Selected people they are ticked and cannot be unticked while their `@` is in the text;
 * - deleting their last `@` unticks them, unless the writer ticked them by hand.
 *
 * Who was ticked by hand is the state; the people the text locks in are added to it on every
 * render, never stored, so deleting a Mention takes away exactly what it put there.
 */
export function useMentionedAudience({
  message,
  teammates,
  readsAnyway,
}: {
  message: string;
  /** Everyone who can be mentioned or selected. Never the writer. */
  teammates: readonly Teammate[];
  /** Who reads it whatever the Visibility: the Receivers, or the Givers asked. */
  readsAnyway: readonly string[];
}) {
  const [chosen, setChosen] = useState<AudienceValue>('EVERYONE');
  const [ticked, setTicked] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  const outsidersIn = (text: string) =>
    mentionedTeammates(text, teammates).filter(
      (teammate) => !readsAnyway.includes(teammate.accountId),
    );
  const outsiders = outsidersIn(message);
  const lockedAccountIds: ReadonlySet<string> = new Set(
    outsiders.map((teammate) => teammate.accountId),
  );
  // Only me with somebody mentioned is never what is sent, even for the render before the
  // message handler has moved the choice on — a Receiver taken off the list can get it here.
  const visibility: AudienceValue =
    chosen === 'ONLY_ME' && outsiders.length > 0 ? 'SELECTED_PEOPLE' : chosen;
  const selectedAccountIds: ReadonlySet<string> = new Set([
    ...ticked,
    ...lockedAccountIds,
  ]);

  return {
    visibility,
    selectedAccountIds,
    lockedAccountIds,
    /** Those people, each with the reason the people dialog shows for keeping them selected. */
    lockedPeople: new Map(
      [...lockedAccountIds].map((accountId) => [accountId, MENTIONED]),
    ) as ReadonlyMap<string, string>,
    /** Only me, while somebody mentioned would be left out by it. */
    onlyMeDisabled: outsiders.length > 0,
    /** Why the choice moved to Selected people by itself, while that is still the choice. */
    notice: visibility === 'SELECTED_PEOPLE' ? notice : null,
    /** Says why Only me cannot be chosen, naming who it would leave out. */
    lockedReason:
      outsiders.length > 0
        ? `${names.format(outsiders.map((teammate) => teammate.name))} ${outsiders.length === 1 ? 'is' : 'are'} mentioned, so they can read it.`
        : null,
    /** Call with each new message, before it is stored. */
    noteMessage(next: string) {
      const nowMentioned = outsidersIn(next);
      if (chosen === 'ONLY_ME' && nowMentioned.length > 0) {
        setChosen('SELECTED_PEOPLE');
        setNotice(
          `Changed to Selected people because you mentioned ${names.format(nowMentioned.map((teammate) => teammate.name))}.`,
        );
      }
    },
    choose(value: AudienceValue) {
      setChosen(value);
      setNotice(null);
    },
    /**
     * The people now selected, from the people dialog. Somebody locked in by a Mention stays out
     * of what was ticked by hand, unless they were ticked by hand already.
     */
    select(accountIds: ReadonlySet<string>) {
      setTicked(
        new Set(
          [...accountIds].filter(
            (accountId) =>
              !lockedAccountIds.has(accountId) || ticked.has(accountId),
          ),
        ),
      );
    },
  };
}
