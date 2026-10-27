'use client';

import { useId, useState } from 'react';
import { AvatarGroupButton } from '@/components/molecules/avatar-group-button';
import { chosenPeople } from '@/lib/feedback/chosen-people.util';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { MemberPickerDialog } from './member-picker-dialog';

export type MemberPickerProps = {
  teammates: readonly Teammate[];
  /** The chosen teammate's Account id, or `''` while nobody is chosen. */
  value: string;
  /** What choosing means: the button's name and the dialog's title. */
  label?: string;
  /** Under the dialog's title: what the person chosen will see. */
  description?: React.ReactNode;
  /** The form field the Account id is sent as. */
  name?: string;
  errorMessage?: string;
  onChange: (accountId: string) => void;
  /** The button, so a form can move focus here when nobody is picked. */
  ref?: React.Ref<HTMLButtonElement>;
};

/**
 * One teammate, from the Members of the person's own Workspace: who Feedback is for. It looks
 * like `MemberMultiPicker` — the person chosen as a face beside a dashed "+", and pressing either
 * opens `MemberPickerDialog` — but the dialog's rows are radios, so choosing someone replaces
 * whoever was chosen before.
 *
 * The Account id reaches the form through a hidden field, and only once somebody is chosen.
 */
export function MemberPicker({
  teammates,
  value,
  label = 'Choose who it is for',
  description = 'They see your name with it.',
  name = 'receiverAccountId',
  errorMessage,
  onChange,
  ref,
}: MemberPickerProps) {
  const messageId = useId();
  const [open, setOpen] = useState(false);
  const invalid = errorMessage !== undefined;
  const chosen = value === '' ? [] : [value];

  // Radios cannot be unticked, so Done hands back nobody only when nobody was ever chosen.
  function handleDone([accountId]: readonly string[]) {
    if (accountId !== undefined && accountId !== value) {
      onChange(accountId);
    }
  }

  return (
    <div className="flex flex-col">
      <AvatarGroupButton
        ref={ref}
        people={chosenPeople(teammates, chosen)}
        label={label}
        invalid={invalid}
        aria-describedby={invalid ? messageId : undefined}
        onClick={() => setOpen(true)}
      />
      <MemberPickerDialog
        teammates={teammates}
        value={chosen}
        title={label}
        description={description}
        open={open}
        single
        onOpenChange={setOpen}
        onDone={handleDone}
      />
      {value !== '' && <input type="hidden" name={name} value={value} />}
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
