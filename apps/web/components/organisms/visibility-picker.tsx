'use client';

import { useId, useRef, useState } from 'react';
import { Label } from '@/components/atoms/label';
import { RadioGroup, RadioGroupItem } from '@/components/atoms/radio-group';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { AvatarGroupButton } from '@/components/molecules/avatar-group-button';
import { chosenPeople } from '@/lib/feedback/chosen-people.util';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { MemberPickerDialog } from './member-picker-dialog';

/** The Visibility that asks for a list of people. Both forms call it the same. */
export const SELECTED_PEOPLE = 'SELECTED_PEOPLE';

/** What choosing the people to share with is called: the button's name and the dialog's title. */
const CHOOSE_PEOPLE = 'Choose who else can read';

export type VisibilityOption<Value extends string> = {
  readonly value: Value;
  readonly label: string;
};

export type VisibilityPickerProps<Value extends string> = {
  /** The choices in the order they are offered. One of them is `SELECTED_PEOPLE`. */
  options: readonly VisibilityOption<Value>[];
  value: Value;
  /** Who may be selected: never the person who always reads it anyway. */
  people: readonly Teammate[];
  selectedAccountIds: ReadonlySet<string>;
  /** What the current choice means, under the choices. */
  helperText: React.ReactNode;
  /** Who reads it whatever is chosen, said under the people dialog's title. */
  peopleDescription: React.ReactNode;
  errorMessage?: string;
  /**
   * Where the error is already said, by element id. Given, the picker marks the people invalid
   * and points at it rather than saying it a second time.
   */
  errorId?: string;
  onValueChange: (value: Value) => void;
  /** Done was pressed in the people dialog: everyone selected now. */
  onSelectedChange: (accountIds: ReadonlySet<string>) => void;
  /** Choices that cannot be taken now; the helper text says why. */
  disabledValues?: ReadonlySet<Value>;
  /** People selected who cannot be unselected, each with the reason the dialog shows. */
  lockedPeople?: ReadonlyMap<string, string>;
  /** The people button, so a form can move focus there when nobody is picked. */
  ref?: React.Ref<HTMLButtonElement>;
};

/**
 * "Who else can read it?" — the Visibility chosen when sending Feedback or asking for it, and the
 * people picked when it is Selected people. The people show as a stack of faces ending in a
 * dashed "+", for that choice only; either opens `MemberPickerDialog`.
 *
 * Choosing Selected people with nobody picked opens the dialog at once. Leaving it with nobody
 * picked, by Cancel or by Done, puts the choice back where it was, so Selected people is never
 * left standing for nobody.
 */
export function VisibilityPicker<Value extends string>({
  options,
  value,
  people,
  selectedAccountIds,
  helperText,
  peopleDescription,
  errorMessage,
  errorId,
  onValueChange,
  onSelectedChange,
  disabledValues,
  lockedPeople,
  ref,
}: VisibilityPickerProps<Value>) {
  const id = useId();
  const messageId = errorId ?? `${id}-message`;
  const [peopleOpen, setPeopleOpen] = useState(false);
  // The choice before Selected people, while the dialog it opened is still up.
  const before = useRef<Value | null>(null);

  function handleChoose(chosen: Value) {
    if (chosen === SELECTED_PEOPLE && selectedAccountIds.size === 0) {
      before.current = value;
      setPeopleOpen(true);
    }
    onValueChange(chosen);
  }

  function handlePeopleOpenChange(open: boolean) {
    setPeopleOpen(open);
    if (!open) {
      before.current = null;
    }
  }

  function putBackIfNobody(accountIds: readonly string[]) {
    if (accountIds.length === 0 && before.current !== null) {
      onValueChange(before.current);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <Text as="span" id={id} variant="label">
          Who else can read it?
        </Text>
        <RadioGroup
          aria-labelledby={id}
          value={value}
          onValueChange={(chosen) => {
            // Only the options passed in are rendered, so nothing else can be chosen.
            const option = options.find((each) => each.value === chosen);
            if (option) handleChoose(option.value);
          }}
        >
          {options.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem
                value={option.value}
                id={`${id}-${option.value}`}
                disabled={disabledValues?.has(option.value)}
              />
              <Label htmlFor={`${id}-${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
        <Text as="p" variant="caption" tone="muted">
          {helperText}
        </Text>
      </div>
      {value === SELECTED_PEOPLE && (
        <div className="flex flex-col gap-2 border-border-subtle border-t pt-3">
          <Text as="span" variant="label" aria-hidden="true">
            Share it with
          </Text>
          <AvatarGroupButton
            ref={ref}
            people={chosenPeople(people, selectedAccountIds)}
            label={CHOOSE_PEOPLE}
            size="md"
            invalid={errorMessage !== undefined}
            aria-describedby={errorMessage ? messageId : undefined}
            onClick={() => setPeopleOpen(true)}
          />
          {errorMessage && !errorId && (
            <p
              id={messageId}
              className="text-input-helper text-status-error-fg"
            >
              {errorMessage}
            </p>
          )}
        </div>
      )}
      <MemberPickerDialog
        teammates={people}
        value={[...selectedAccountIds]}
        title={CHOOSE_PEOPLE}
        description={peopleDescription}
        open={peopleOpen}
        onOpenChange={handlePeopleOpenChange}
        locked={lockedPeople}
        onDone={(accountIds) => {
          putBackIfNobody(accountIds);
          onSelectedChange(new Set(accountIds));
        }}
        onCancel={() => putBackIfNobody([...selectedAccountIds])}
      />
    </>
  );
}

/**
 * A `VisibilityPicker` still loading: its question, one radio per option, and the two lines that
 * say what the choice means. Selected people is never the default, so its list is not drawn.
 */
export function VisibilityPickerSkeleton<Value extends string>({
  options,
}: {
  options: readonly VisibilityOption<Value>[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="w-1/3 text-label" />
      <div className="grid gap-3">
        {options.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <Skeleton shape="circle" className="size-4" />
            <Skeleton className="w-40 text-subtitle-4" />
          </div>
        ))}
      </div>
      <div className="flex flex-col">
        <Skeleton className="text-caption" />
        <Skeleton className="w-1/2 text-caption" />
      </div>
    </div>
  );
}
