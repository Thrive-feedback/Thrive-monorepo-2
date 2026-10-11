import { useId } from 'react';
import type { Teammate } from '@/app/(signed-in)/feedback/request/_lib/teammate.type';
import { Label } from '@/components/atoms/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';

export type MemberPickerProps = {
  teammates: readonly Teammate[];
  /** The chosen teammate's Account id, or `''` while nobody is chosen. */
  value: string;
  errorMessage?: string;
  onChange: (accountId: string) => void;
  /** The trigger, so a form can move focus here when nobody is picked. */
  ref?: React.Ref<HTMLButtonElement>;
};

/**
 * Who to ask, from the Members of the person's own Workspace.
 *
 * `name` on `Select` is what puts the Account id in the form data: the trigger is a button, so
 * the value reaches a submit through a hidden field rather than the trigger itself. And `value`
 * is `''` rather than `null` while nobody is chosen, so the control is controlled from its first
 * render — switching between the two makes React warn and drop the value.
 */
export function MemberPicker({
  teammates,
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
        className={invalid ? 'mb-2 block text-status-error-fg' : 'mb-2 block'}
      >
        <span aria-hidden="true" className="me-1 text-status-error-fg">
          *
        </span>
        Who do you want to ask?
      </Label>
      <Select name="giverAccountId" value={value} onValueChange={onChange}>
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
