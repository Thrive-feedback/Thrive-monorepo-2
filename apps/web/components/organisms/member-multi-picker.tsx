'use client';

import { cva } from 'class-variance-authority';
import { ChevronDownIcon, XIcon } from 'lucide-react';
import { useId } from 'react';
import { Badge } from '@/components/atoms/badge';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { Label } from '@/components/atoms/label';
import { Skeleton } from '@/components/atoms/skeleton';
import { cn } from '@/lib/cn.util';
import type { Teammate } from '@/lib/feedback/teammate.type';

/** The question above the picker, or kept for a screen reader where a row label stands in. */
const pickerLabel = cva('', {
  variants: {
    hidden: { true: 'sr-only', false: 'mb-1 block' },
    invalid: { true: 'text-status-error-fg', false: '' },
  },
});

export type MemberMultiPickerProps = {
  teammates: readonly Teammate[];
  /** Keeps the label for a screen reader only, where a row label already says who it is for. */
  hideLabel?: boolean;
  /** What the picker asks. */
  label?: string;
  /** The form field each picked Account id is sent as, once per person. */
  name?: string;
  /** The picked teammates' Account ids, in the order they were picked. */
  value: readonly string[];
  errorMessage?: string;
  onChange: (accountIds: readonly string[]) => void;
  /** The trigger, so a form can move focus here when nobody is picked. */
  ref?: React.Ref<HTMLButtonElement>;
};

/**
 * Several teammates, from the Members of the person's own Workspace: everyone a Feedback Request
 * asks (#30). The menu stays open while people are ticked. Each person picked shows as a chip
 * with its own remove button. The chips sit outside the trigger, because a button inside a button
 * is not something a screen reader can reach.
 *
 * There is no limit on how many people can be picked. Each picked Account id reaches the form
 * through a hidden field of its own, the way `MemberPicker`'s `Select` sends one.
 */
export function MemberMultiPicker({
  teammates,
  label = 'Who do you want to ask?',
  name = 'giverAccountIds',
  value,
  errorMessage,
  hideLabel = false,
  onChange,
  ref,
}: MemberMultiPickerProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const invalid = errorMessage !== undefined;
  const picked = new Set(value);
  const pickedTeammates = value.flatMap((accountId) => {
    const teammate = teammates.find((one) => one.accountId === accountId);
    return teammate ? [teammate] : [];
  });

  function toggle(accountId: string, checked: boolean) {
    onChange(
      checked
        ? [...value, accountId]
        : value.filter((pickedId) => pickedId !== accountId),
    );
  }

  return (
    <div className="flex flex-col">
      <Label
        htmlFor={id}
        className={pickerLabel({ hidden: hideLabel, invalid })}
      >
        <span aria-hidden="true" className="me-1 text-status-error-fg">
          *
        </span>
        {label}
      </Label>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          ref={ref}
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? messageId : undefined}
          className={cn(
            'flex w-full items-center justify-between gap-2 whitespace-nowrap rounded-input border border-border-strong bg-surface-base px-3 py-2.5 text-start text-body-1 aria-invalid:border-status-error-border',
            pickedTeammates.length === 0 && 'text-fg-disabled',
          )}
        >
          {pickedTeammates.length === 0
            ? 'Pick teammates'
            : `${pickedTeammates.length} picked`}
          <ChevronDownIcon className="size-4 shrink-0 text-fg-secondary" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={4}
          className="max-h-72 w-(--radix-dropdown-menu-trigger-width) overflow-y-auto"
        >
          {teammates.map((teammate) => (
            <DropdownMenuCheckboxItem
              key={teammate.accountId}
              checked={picked.has(teammate.accountId)}
              onCheckedChange={(checked) =>
                toggle(teammate.accountId, checked === true)
              }
            >
              {teammate.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {pickedTeammates.length > 0 && (
        <ul aria-label="Picked" className="mt-2 flex flex-wrap gap-1.5">
          {pickedTeammates.map((teammate) => (
            <li key={teammate.accountId}>
              <Badge tone="brand" size="md" className="gap-1 pe-1.5">
                {teammate.name}
                <button
                  type="button"
                  aria-label={`Remove ${teammate.name}`}
                  className="flex size-4 cursor-pointer items-center justify-center rounded-full"
                  onClick={() => toggle(teammate.accountId, false)}
                >
                  <XIcon aria-hidden="true" className="size-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
      {value.map((accountId) => (
        <input key={accountId} type="hidden" name={name} value={accountId} />
      ))}
      {invalid && (
        <p
          id={messageId}
          className="mt-1.5 text-input-helper text-status-error-fg"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}

/** A `MemberMultiPicker` still loading: its label and the closed picker. */
export function MemberMultiPickerSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="mb-1 w-1/3 text-subtitle-4" />
      <Skeleton shape="control" className="h-11.5 rounded-input" />
    </div>
  );
}
