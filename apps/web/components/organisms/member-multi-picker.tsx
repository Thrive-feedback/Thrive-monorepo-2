'use client';

import { useId, useState } from 'react';
import { AvatarGroupButton } from '@/components/molecules/avatar-group-button';
import { chosenPeople } from '@/lib/feedback/chosen-people.util';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { MemberPickerDialog } from './member-picker-dialog';

export type MemberMultiPickerProps = {
  teammates: readonly Teammate[];
  /** The picked teammates' Account ids, in the order they were picked. */
  value: readonly string[];
  /** What choosing means, such as "Choose who to ask": the button's name and the dialog's title. */
  label?: string;
  /** Under the dialog's title: what the people chosen will do, or who reads it whatever happens. */
  description?: React.ReactNode;
  /** The form field each picked Account id is sent as, once per person. */
  name?: string;
  errorMessage?: string;
  onChange: (accountIds: readonly string[]) => void;
  /** The button, so a form can move focus here when nobody is picked. */
  ref?: React.Ref<HTMLButtonElement>;
};

/**
 * Several teammates, from the Members of the person's own Workspace: everyone a Feedback Request
 * asks (#30), everyone Offered Feedback is for (brain `ADR-0044`), or everyone a letter is for.
 * The people picked show as a stack of faces ending in a dashed "+"; pressing either opens
 * `MemberPickerDialog` to change them.
 *
 * There is no limit on how many people can be picked. Each picked Account id reaches the form
 * through a hidden field of its own.
 */
export function MemberMultiPicker({
  teammates,
  value,
  label = 'Choose who to ask',
  description = 'They each answer in their own words.',
  name = 'giverAccountIds',
  errorMessage,
  onChange,
  ref,
}: MemberMultiPickerProps) {
  const messageId = useId();
  const [open, setOpen] = useState(false);
  const invalid = errorMessage !== undefined;

  return (
    <div className="flex flex-col">
      <AvatarGroupButton
        ref={ref}
        people={chosenPeople(teammates, value)}
        label={label}
        invalid={invalid}
        aria-describedby={invalid ? messageId : undefined}
        onClick={() => setOpen(true)}
      />
      <MemberPickerDialog
        teammates={teammates}
        value={value}
        title={label}
        description={description}
        open={open}
        onOpenChange={setOpen}
        onDone={onChange}
      />
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
