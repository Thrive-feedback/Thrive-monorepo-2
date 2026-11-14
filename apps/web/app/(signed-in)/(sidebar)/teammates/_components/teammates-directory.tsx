'use client';

import { SearchIcon } from 'lucide-react';
import NextLink from 'next/link';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ComposeCards,
  useComposeCards,
  warmComposeCards,
} from '@/app/(signed-in)/(sidebar)/_components/compose-cards';
import type { ComposeChoice } from '@/app/(signed-in)/(sidebar)/_lib/compose-choice.constant';
import {
  byName,
  pageOf,
  searchTeammates,
} from '@/app/(signed-in)/(sidebar)/teammates/_lib/teammate-search.util';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Text } from '@/components/atoms/text';
import { CardsEmpty } from '@/components/organisms/cards-empty';
import type { PostcardWriter } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { ROUTES } from '@/lib/routes.constant';
import { TeammateRow } from './teammate-row';
import { TeammatesPager } from './teammates-pager';

export type TeammatesDirectoryProps = {
  /** Everyone in the Workspace, the person included, in any order. */
  people: readonly Teammate[];
  /** Everyone but the person: who a card can be for. The one in `people` and not here is them. */
  teammates: readonly Teammate[];
  /** The Workspace the page was drawn for, which a card is sent to. */
  workspaceId: string;
  /** Its name, for saying nobody else is in it yet. */
  workspaceName: string;
  /** The Workspace's active Workspace Goals, by name, offered on `#`. */
  workspaceGoals: readonly string[];
  writer: PostcardWriter;
  /** An Admin can invite people, so an empty Workspace points them there. */
  isAdmin: boolean;
};

/** Who a card was opened for, and which card. */
type Chosen = {
  choice: ComposeChoice;
  teammate: Teammate;
};

/**
 * Everyone in the Workspace, by name, ten to a page, found by name, email or @handle as it is typed.
 * The person is among them where their name falls, marked as them. Everyone else offers Give, Ask
 * and Kudos, which open that card already for them: the postcard with them as who it is for or who
 * is asked, the Kudos with their @mention written. Every opening is a new card, so whoever the last
 * one was for never carries over. Alone in the Workspace, the person is pointed at inviting people
 * rather than shown a list of one.
 */
export function TeammatesDirectory({
  people,
  teammates,
  workspaceId,
  workspaceName,
  workspaceGoals,
  writer,
  isAdmin,
}: TeammatesDirectoryProps) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  /** The button a card was opened from, which takes focus back when it closes. */
  const openedFrom = useRef<HTMLButtonElement | null>(null);
  const { openCard, cards } = useComposeCards();

  // The list holds everyone, the person among the rest by name; who a card can be for does not.
  // Search and pages run over the whole Workspace, read once on the server: see `ONE_PAGE` in
  // `lib/feedback/teammates.service.ts` for why, and for the limit past 100 Members.
  const everyone = useMemo(() => byName(people), [people]);
  const teammateIds = useMemo(
    () => new Set(teammates.map(({ accountId }) => accountId)),
    [teammates],
  );
  const found = useMemo(
    () => searchTeammates(everyone, query),
    [everyone, query],
  );
  const shown = pageOf(found, page);

  // Who the card opens for, held still between choices: the cards are memoised, and typing a search
  // would otherwise draw them again for nothing.
  const recipientAccountIds = useMemo(
    () =>
      chosen && chosen.choice !== 'kudos'
        ? [chosen.teammate.accountId]
        : undefined,
    [chosen],
  );
  const kudosMention =
    chosen?.choice === 'kudos' && chosen.teammate.slug !== null
      ? `@${chosen.teammate.slug} `
      : undefined;

  function handleChoose(
    choice: ComposeChoice,
    teammate: Teammate,
    from: HTMLButtonElement,
  ) {
    openedFrom.current = from;
    setChosen({ choice, teammate });
    openCard(choice);
  }

  // The card opened from a row's button, not from a `DialogTrigger`, so Radix has nowhere to send
  // focus back to: it goes to that button, while it is still on the page. Stable, so the memoised
  // cards are not drawn again for every letter typed into the search.
  const handleCardCloseAutoFocus = useCallback((event: Event) => {
    event.preventDefault();
    if (openedFrom.current?.isConnected) {
      openedFrom.current.focus();
    }
  }, []);

  function handleClearSearch() {
    setQuery('');
    setPage(1);
    searchRef.current?.focus();
  }

  if (teammates.length === 0) {
    return (
      <CardsEmpty
        art="every"
        title={`Nobody else is in ${workspaceName} yet.`}
        description={
          isAdmin
            ? 'Invite the people you work with, then give them feedback, ask for theirs, or say well done.'
            : 'An Admin can invite them. Once they join, you can give them feedback, ask for theirs, or say well done.'
        }
      >
        {isAdmin && (
          <Button asChild variant="primary">
            <NextLink href={ROUTES.settings.teammates}>Invite people</NextLink>
          </Button>
        )}
      </CardsEmpty>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* The search and what it found nothing for travel together, so the empty status takes no
          room of its own in the column. */}
      <div className="flex flex-col">
        <div className="relative">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-fg-secondary"
          />
          <Input
            ref={searchRef}
            type="search"
            aria-label="Search teammates"
            placeholder="Search by name, email or @handle"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            className="ps-10"
          />
        </div>

        {/* Always there, so what it comes to say is announced: a live region that arrives already
          holding its words is not read out by every screen reader. */}
        <div role="status">
          {found.length === 0 && (
            <div className="flex flex-col items-center gap-3 pt-14 pb-8">
              <Text as="p" variant="body-2" tone="muted">
                Nobody matches “{query.trim()}”.
              </Text>
              <Button size="sm" onClick={handleClearSearch}>
                Clear search
              </Button>
            </div>
          )}
        </div>
      </div>

      {found.length > 0 && (
        <div className="rounded-page border border-border-muted px-4 md:px-6">
          <ul
            aria-label="Teammates"
            className="flex flex-col divide-y divide-border-subtle"
            // Warmed as the person reaches for a row, so the card is ready by the press.
            onPointerEnter={warmComposeCards}
            onFocus={warmComposeCards}
          >
            {shown.items.map((person) => (
              <TeammateRow
                key={person.accountId}
                teammate={person}
                isYou={!teammateIds.has(person.accountId)}
                onChoose={handleChoose}
              />
            ))}
          </ul>
        </div>
      )}

      {shown.pageTotal > 1 && (
        <TeammatesPager
          page={shown.page}
          pageTotal={shown.pageTotal}
          onGoBack={() => setPage(shown.page - 1)}
          onGoOn={() => setPage(shown.page + 1)}
        />
      )}

      <ComposeCards
        cards={cards}
        workspaceId={workspaceId}
        teammates={teammates}
        workspaceGoals={workspaceGoals}
        writer={writer}
        defaultRecipientAccountIds={recipientAccountIds}
        defaultMessage={kudosMention}
        onCloseAutoFocus={handleCardCloseAutoFocus}
      />
    </div>
  );
}
