import { useId } from 'react';
import { Label } from '@/components/atoms/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import type { Teammate } from '@/lib/feedback/teammate.type';

export type MemberPickerProps = {
  teammates: readonly Teammate[];
  /** What the picker asks. Asking for Feedback and giving it pick a different person. */
  label?: string;
  /** The form field the Account id is sent as. */
  name?: string;
  /** The chosen teammate's Account id, or `''` while nobody is chosen. */
  value: string;
  errorMessage?: string;
  onChange: (accountId: string) => void;
  /** The trigger, so a form can move focus here when nobody is picked. */
  ref?: React.Ref<HTMLButtonElement>;
};

/**
 * One teammate, from the Members of the person's own Workspace: who to ask, or who to give
 * Feedback to.
 *
 * `name` on `Select` is what puts the Account id in the form data: the trigger is a button, so
 * the value reaches a submit through a hidden field rather than the trigger itself. And `value`
 * is `''` rather than `null` while nobody is chosen, so the control is controlled from its first
 * render — switching between the two makes React warn and drop the value.
 */
export function MemberPicker({
  teammates,
  label = 'Who do you want to ask?',
  name = 'giverAccountId',
  value,
  errorMessage,
  onChange,
  ref,
}: MemberPickerProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const invalid = errorMessage !== undefined;

  return (
    <div className="flex flex-col">
      <Label
        htmlFor={id}
        className={invalid ? 'mb-1 block text-status-error-fg' : 'mb-1 block'}
      >
        <span aria-hidden="true" className="me-1 text-status-error-fg">
          *
        </span>
        {label}
      </Label>
      <Select name={name} value={value} onValueChange={onChange}>
        <SelectTrigger
          ref={ref}
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? messageId : undefined}
        >
          <SelectValue placeholder="Pick a teammate" />
        </SelectTrigger>
        <SelectContent>
          {teammates.map((teammate) => (
            <SelectItem key={teammate.accountId} value={teammate.accountId}>
              {teammate.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
