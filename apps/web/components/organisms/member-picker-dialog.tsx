'use client';

import { cva } from 'class-variance-authority';
import { useId, useRef, useState } from 'react';
import { Button } from '@/components/atoms/button';
import { Checkbox } from '@/components/atoms/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';
import { Input } from '@/components/atoms/input';
import { Text } from '@/components/atoms/text';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import {
  matchesSearch,
  searchWord,
  takeMentions,
} from '@/lib/feedback/member-search.util';
import type { Teammate } from '@/lib/feedback/teammate.type';

/**
 * Where the list goes. A Workspace long enough to scroll keeps it one height while the search
 * filters it, so the dialog, centred on the page, does not jump with every key.
 */
const listArea = cva('flex flex-col', {
  variants: { steady: { true: 'h-80', false: '' } },
});

/** More people than this and the list scrolls, so its area stays one height. */
const STEADY_FROM = 6;

export type MemberPickerDialogProps = {
  /** Everyone who can be chosen, in the order they are listed. */
  teammates: readonly Teammate[];
  /** Who is chosen now: the dialog starts from them each time it opens. */
  value: readonly string[];
  /** What is being chosen, such as "Choose who to ask". */
  title: string;
  /** Who reads it whatever is chosen, or what the people chosen will do. */
  description: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Done was pressed: the people now chosen, in the order they were ticked. */
  onDone: (accountIds: readonly string[]) => void;
  /** It closed without Done — Cancel, the ×, Escape or a click outside — and nothing changed. */
  onCancel?: () => void;
};

/**
 * Choosing several teammates in a dialog: who to ask, who a letter is for, who else can read it.
 * Ticks are a draft until Done, so Cancel leaves the choice as it was.
 *
 * The search filters by name, email or handle, and `@handle` ticks people straight from the
 * keyboard: "@mali @krit " ticks both once each is finished by a space, and a pasted line ticks
 * everyone it names. A handle that names nobody stays in the field, and the dialog says so.
 */
export function MemberPickerDialog({
  open,
  onOpenChange,
  onCancel,
  ...rest
}: MemberPickerDialogProps) {
  // Opened from outside a `DialogTrigger`, so Radix has nowhere to send focus back to on close:
  // the control that had focus when it opened gets it again.
  const opener = useRef<HTMLElement | null>(null);

  // Done closes the dialog itself; anything else that closes it is a cancel.
  function handleOpenChange(next: boolean) {
    if (!next) {
      onCancel?.();
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* The content unmounts while closed, so each opening starts from `value` again. */}
      <DialogContent
        className="gap-5"
        onOpenAutoFocus={() => {
          opener.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          opener.current?.focus();
        }}
      >
        <MemberPickerBody
          {...rest}
          onDone={(accountIds) => {
            rest.onDone(accountIds);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

type MemberPickerBodyProps = Pick<
  MemberPickerDialogProps,
  'teammates' | 'value' | 'title' | 'description' | 'onDone'
>;

function MemberPickerBody({
  teammates,
  value,
  title,
  description,
  onDone,
}: MemberPickerBodyProps) {
  const id = useId();
  const [draft, setDraft] = useState<readonly string[]>(value);
  const [query, setQuery] = useState('');
  const pasted = useRef(false);
  const chosen = new Set(draft);
  const word = searchWord(query);
  const shown = teammates.filter((teammate) => matchesSearch(teammate, word));
  const { unknown } = takeMentions(query, teammates);

  function choose(accountIds: readonly string[]) {
    setDraft((current) => [
      ...current,
      ...accountIds.filter((accountId) => !current.includes(accountId)),
    ]);
  }

  function toggle(accountId: string, checked: boolean) {
    if (checked) {
      choose([accountId]);
    } else {
      setDraft((current) => current.filter((each) => each !== accountId));
    }
  }

  function handleSearch(text: string, finishAll: boolean) {
    const taken = takeMentions(text, teammates, { finishAll });
    choose(taken.accountIds);
    setQuery(taken.rest);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleSearch(event.target.value, pasted.current);
    pasted.current = false;
  }

  // Enter finishes the word being typed. A word that is no handle but leaves one person in the
  // list ticks that person, so "ma" then Enter is enough.
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    const taken = takeMentions(query, teammates, { finishAll: true });
    const only = shown.length === 1 ? shown[0] : undefined;
    if (taken.accountIds.length === 0 && word !== '' && only) {
      const typed = query.split(/\s+/).pop() ?? '';
      choose([only.accountId]);
      setQuery(query.slice(0, query.length - typed.length));
      return;
    }
    choose(taken.accountIds);
    setQuery(taken.rest);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-1.5">
        <Input
          type="search"
          aria-label="Search by name or email, or type @ and a name"
          aria-describedby={unknown.length > 0 ? `${id}-unknown` : undefined}
          placeholder="Search, or type @name"
          autoComplete="off"
          value={query}
          onChange={handleChange}
          onPaste={() => {
            pasted.current = true;
          }}
          onKeyDown={handleKeyDown}
          className="px-3 py-2.5"
        />
        <p
          id={`${id}-unknown`}
          aria-live="polite"
          className="text-body-3 text-status-error-fg empty:hidden"
        >
          {unknown.length > 0 ? `Nobody is ${unknown.join(', ')}.` : ''}
        </p>
      </div>

      <div className={listArea({ steady: teammates.length >= STEADY_FROM })}>
        {teammates.length === 0 ? (
          <Text variant="body-2" tone="muted">
            Nobody else is in your Workspace yet.
          </Text>
        ) : shown.length === 0 ? (
          <Text variant="body-2" tone="muted" aria-live="polite">
            Nobody matches “{word}”.
          </Text>
        ) : (
          <ul
            aria-label="Teammates"
            className="max-h-80 divide-y divide-border-subtle overflow-y-auto rounded-control border border-border-muted"
          >
            {shown.map((teammate) => {
              const rowId = `${id}-${teammate.accountId}`;
              return (
                <li key={teammate.accountId}>
                  <label
                    htmlFor={rowId}
                    className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-action-neutral-surface-hover"
                  >
                    <PhotoAvatar
                      name={teammate.name}
                      photoUrl={teammate.photoUrl}
                      size="lg"
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span
                        id={`${rowId}-name`}
                        className="truncate text-body-1 text-fg-primary"
                      >
                        {teammate.name}
                      </span>
                      {teammate.email !== teammate.name && (
                        <span
                          id={`${rowId}-email`}
                          className="truncate text-body-3 text-fg-secondary"
                        >
                          {teammate.email}
                        </span>
                      )}
                    </span>
                    <Checkbox
                      id={rowId}
                      aria-labelledby={`${rowId}-name`}
                      aria-describedby={
                        teammate.email !== teammate.name
                          ? `${rowId}-email`
                          : undefined
                      }
                      checked={chosen.has(teammate.accountId)}
                      onCheckedChange={(checked) =>
                        toggle(teammate.accountId, checked === true)
                      }
                    />
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Text variant="body-3" tone="muted" aria-live="polite">
        {draft.length} chosen
      </Text>

      <DialogFooter>
        <DialogClose asChild>
          <Button>Cancel</Button>
        </DialogClose>
        <Button variant="primary" onClick={() => onDone(draft)}>
          {draft.length > 0 ? `Done (${draft.length})` : 'Done'}
        </Button>
      </DialogFooter>
    </>
  );
}
