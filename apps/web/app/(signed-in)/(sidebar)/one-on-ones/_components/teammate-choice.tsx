'use client';

import { SearchIcon } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { Input } from '@/components/atoms/input';
import { RadioGroup, RadioGroupItem } from '@/components/atoms/radio-group';
import { Text } from '@/components/atoms/text';
import { AvatarName } from '@/components/molecules/avatar-name';
import { cn } from '@/lib/cn.util';
import type { Teammate } from '@/lib/feedback/teammate.type';

export type TeammateChoiceProps = {
  teammates: readonly Teammate[];
  value: string | null;
  /** Teammates who cannot be chosen, each with the reason said under their name. */
  unavailable: ReadonlyMap<string, string>;
  onChange: (accountId: string) => void;
};

function matches(teammate: Teammate, query: string): boolean {
  const wanted = query.trim().toLowerCase().replace(/^@/, '');
  if (wanted === '') {
    return true;
  }
  return [teammate.name, teammate.displayName ?? '', teammate.email].some(
    (field) => field.toLowerCase().includes(wanted),
  );
}

/**
 * One teammate to have a 1:1 with, found by name, @handle or email. Somebody the person already has
 * a 1:1 with stays in the list, greyed, saying so, rather than vanishing.
 */
export function TeammateChoice({
  teammates,
  value,
  unavailable,
  onChange,
}: TeammateChoiceProps) {
  const id = useId();
  const [query, setQuery] = useState('');
  const shown = useMemo(
    () => teammates.filter((teammate) => matches(teammate, query)),
    [teammates, query],
  );

  if (teammates.length === 0) {
    return (
      <Text variant="body-2" tone="muted">
        Nobody else is in your Workspace yet.
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted"
        />
        <Input
          type="search"
          aria-label="Find a teammate"
          placeholder="Find a teammate"
          value={query}
          className="pl-9"
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
      </div>
      {shown.length === 0 ? (
        <Text variant="body-2" tone="muted" role="status">
          Nobody matches “{query.trim()}”.
        </Text>
      ) : (
        <RadioGroup
          aria-label="Who it is with"
          value={value ?? ''}
          onValueChange={onChange}
          className="max-h-72 gap-1 overflow-y-auto"
        >
          {shown.map((teammate) => {
            const reason = unavailable.get(teammate.accountId);
            const itemId = `${id}-${teammate.accountId}`;
            return (
              <label
                key={teammate.accountId}
                htmlFor={itemId}
                className={cn(
                  'flex items-center gap-3 rounded-control px-3 py-2 transition-colors duration-quick ease-smooth-out',
                  reason
                    ? 'cursor-not-allowed'
                    : 'cursor-pointer hover:bg-action-neutral-surface-hover has-[[data-state=checked]]:bg-action-primary-surface',
                )}
              >
                <RadioGroupItem
                  id={itemId}
                  value={teammate.accountId}
                  disabled={Boolean(reason)}
                />
                <AvatarName
                  name={teammate.name}
                  photoUrl={teammate.photoUrl}
                  className="flex-1"
                >
                  <span
                    className={cn(
                      'block text-subtitle-4',
                      reason ? 'text-fg-secondary' : 'text-fg-primary',
                    )}
                  >
                    {teammate.name}
                  </span>
                  <Text as="span" variant="body-3" tone="muted">
                    {reason ??
                      (teammate.displayName
                        ? `@${teammate.displayName}`
                        : teammate.email)}
                  </Text>
                </AvatarName>
              </label>
            );
          })}
        </RadioGroup>
      )}
    </div>
  );
}
