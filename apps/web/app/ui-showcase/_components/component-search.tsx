'use client';

import { Search } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { AtomicLevel } from '@/app/ui-showcase/_components/level-badge';
import { LevelBadge } from '@/app/ui-showcase/_components/level-badge';
import { Input } from '@/components/atoms/input';
import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';

export type SearchableLevel = {
  level: AtomicLevel;
  title: string;
  folder: string;
  description: string;
};

export type SearchableCard = {
  slug: string;
  name: string;
  level: AtomicLevel;
  /** Rendered on the server, since a component cannot cross into the client. */
  preview: React.ReactNode;
};

/** A component matches when its name, its slug or its level contains every word typed. */
function matches(card: SearchableCard, query: string) {
  const haystack = `${card.name} ${card.slug} ${card.level}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/** True when the key press lands in something that takes typing, where `/` must stay a character. */
function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

/**
 * The index's search and its cards. Typing narrows the cards in place, level by level, and a
 * level with nothing left is left out; the count is announced as it changes. `/` from anywhere
 * on the page puts the cursor in the search.
 *
 * Each card is one link: its name stretches an invisible `::after` over the whole card, so
 * the card is clickable without wrapping live controls in an `<a>`, which HTML forbids and a
 * screen reader would read as one long link. The preview is `inert`: seen, never focused.
 */
export function ComponentSearch({
  levels,
  cards,
}: {
  levels: readonly SearchableLevel[];
  cards: readonly SearchableCard[];
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const countId = useId();
  const shown = cards.filter((card) => matches(card, query));

  useEffect(() => {
    function focusOnSlash(event: KeyboardEvent) {
      if (event.key !== '/' || isTyping(event.target)) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    document.addEventListener('keydown', focusOnSlash);
    return () => document.removeEventListener('keydown', focusOnSlash);
  }, []);

  return (
    <>
      <search className="flex flex-col gap-2">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-secondary"
          />
          <Input
            ref={inputRef}
            type="search"
            aria-label="Search components"
            aria-describedby={countId}
            placeholder="Search components — press / to jump here"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        <Text
          id={countId}
          variant="body-3"
          tone="muted"
          role="status"
          aria-live="polite"
        >
          {query
            ? `${shown.length} of ${cards.length} components`
            : `${cards.length} components`}
        </Text>
      </search>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-surface border border-border-default border-dashed px-6 py-12 text-center">
          <Text variant="subtitle-2">No component matches “{query}”.</Text>
          <Text variant="body-2" tone="muted">
            Try another name. If it really is missing, add it from shadcn.
          </Text>
        </div>
      ) : (
        levels.map(({ level, title, folder, description }) => {
          const inLevel = shown.filter((card) => card.level === level);
          if (inLevel.length === 0) return null;
          return (
            <section
              key={level}
              aria-labelledby={`${level}-heading`}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <h2 id={`${level}-heading`} className="text-subtitle-1">
                  {title}{' '}
                  <code className="font-normal text-body-2 text-fg-accent">
                    {folder}
                  </code>
                </h2>
                <Text variant="body-2" tone="muted">
                  {description}
                </Text>
              </div>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inLevel.map(({ slug, name, level: cardLevel, preview }) => (
                  <li
                    key={slug}
                    className="relative flex flex-col overflow-hidden rounded-surface border border-border-default hover:border-border-strong hover:bg-surface-raised"
                  >
                    <div
                      inert
                      className="flex min-h-32 flex-1 flex-wrap items-center justify-center gap-3 p-6"
                    >
                      {preview}
                    </div>
                    <div className="flex items-center justify-between gap-2 border-border-default border-t bg-surface-raised px-4 py-3">
                      <Link
                        href={ROUTES.uiShowcase.component(slug)}
                        className="font-semibold text-fg-primary after:absolute after:inset-0"
                      >
                        {name}
                      </Link>
                      <LevelBadge level={cardLevel} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </>
  );
}
