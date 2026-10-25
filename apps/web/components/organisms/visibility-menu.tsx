'use client';

import { ChevronDownIcon, CircleAlertIcon, EyeIcon } from 'lucide-react';
import { Popover } from 'radix-ui';
import { useId } from 'react';
import { Button } from '@/components/atoms/button';
import type { Teammate } from '@/lib/feedback/teammate.type';
import {
  SELECTED_PEOPLE,
  type VisibilityOption,
  VisibilityPicker,
} from './visibility-picker';

export type VisibilityMenuProps<Value extends string> = {
  /** The choices in the order they are offered. One of them is `SELECTED_PEOPLE`. */
  options: readonly VisibilityOption<Value>[];
  value: Value;
  /** Who may be selected: never the person who always reads it anyway. */
  people: readonly Teammate[];
  selectedAccountIds: ReadonlySet<string>;
  /** What the current choice means, under the choices. */
  helperText: React.ReactNode;
  /** Nobody picked for Selected people. Marks the button and the people still to pick. */
  errorMessage?: string;
  /** Where the form already says the error, so the menu points at it rather than repeating it. */
  errorId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: Value) => void;
  onSelectedChange: (accountId: string, selected: boolean) => void;
};

/**
 * "Who else can read it?" folded into one button beside Send, which always says the current
 * choice, so nobody sends without seeing it. It opens the full `VisibilityPicker` below itself,
 * clear of the fields being filled in, and above only where the window has no room under it.
 * The form holds whether it is open, so a refusal can open it on the people still to pick.
 */
export function VisibilityMenu<Value extends string>({
  options,
  value,
  people,
  selectedAccountIds,
  helperText,
  errorMessage,
  errorId,
  open,
  onOpenChange,
  onValueChange,
  onSelectedChange,
}: VisibilityMenuProps<Value>) {
  const contentId = useId();
  const chosen = options.find((option) => option.value === value);
  const picked = people.filter((person) =>
    selectedAccountIds.has(person.accountId),
  ).length;
  const summary =
    value === SELECTED_PEOPLE && picked > 0
      ? `${chosen?.label} · ${picked}`
      : chosen?.label;

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          prefixIcon={errorMessage ? <CircleAlertIcon /> : <EyeIcon />}
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={errorMessage ? errorId : undefined}
          className="aria-invalid:bg-status-error-surface aria-invalid:text-status-error-fg"
        >
          <span className="sr-only">Who else can read it: </span>
          {summary}
          <ChevronDownIcon aria-hidden="true" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          id={contentId}
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={16}
          onOpenAutoFocus={(event) => {
            // Opened by a refusal, focus goes to the people still to pick rather than the choices.
            const firstPerson = (
              event.currentTarget as HTMLElement | null
            )?.querySelector<HTMLElement>('fieldset button');
            if (errorMessage && firstPerson) {
              event.preventDefault();
              firstPerson.focus();
            }
          }}
          className="z-50 flex w-80 max-w-(--radix-popover-content-available-width) flex-col gap-3 rounded-control border border-border-muted bg-surface-raised p-4 text-fg-primary shadow-med"
        >
          <VisibilityPicker
            options={options}
            value={value}
            people={people}
            selectedAccountIds={selectedAccountIds}
            helperText={helperText}
            errorMessage={errorMessage}
            errorId={errorId}
            onValueChange={onValueChange}
            onSelectedChange={onSelectedChange}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
