import { useId } from 'react';
import { Checkbox } from '@/components/atoms/checkbox';
import { Label } from '@/components/atoms/label';
import { RadioGroup, RadioGroupItem } from '@/components/atoms/radio-group';
import { Text } from '@/components/atoms/text';
import type { Teammate } from '@/lib/feedback/teammate.type';

/** The Visibility that asks for a list of people. Both forms call it the same. */
export const SELECTED_PEOPLE = 'SELECTED_PEOPLE';

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
  errorMessage?: string;
  onValueChange: (value: Value) => void;
  onSelectedChange: (accountId: string, selected: boolean) => void;
  /** The list of people, so a form can move focus there when nobody is picked. */
  ref?: React.Ref<HTMLFieldSetElement>;
};

/**
 * "Who else can read it?" — the Visibility chosen when sending Feedback or asking for it, and the
 * people picked when it is Selected people. The list appears only for that choice.
 */
export function VisibilityPicker<Value extends string>({
  options,
  value,
  people,
  selectedAccountIds,
  helperText,
  errorMessage,
  onValueChange,
  onSelectedChange,
  ref,
}: VisibilityPickerProps<Value>) {
  const id = useId();
  const messageId = `${id}-message`;

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
            if (option) onValueChange(option.value);
          }}
        >
          {options.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem
                value={option.value}
                id={`${id}-${option.value}`}
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
        <fieldset
          ref={ref}
          aria-describedby={errorMessage ? messageId : undefined}
          className="flex flex-col gap-2 rounded-element border border-border-subtle p-3"
        >
          <Text as="legend" variant="label" className="px-1">
            Share it with
          </Text>
          {people.length === 0 ? (
            <Text variant="body-2" tone="muted">
              Nobody else is in your Workspace yet.
            </Text>
          ) : (
            people.map((person) => {
              const personId = `${id}-share-${person.accountId}`;
              return (
                <div key={person.accountId} className="flex items-center gap-2">
                  <Checkbox
                    id={personId}
                    checked={selectedAccountIds.has(person.accountId)}
                    onCheckedChange={(checked) =>
                      onSelectedChange(person.accountId, checked === true)
                    }
                    aria-invalid={errorMessage ? true : undefined}
                  />
                  <Label htmlFor={personId}>{person.name}</Label>
                </div>
              );
            })
          )}
          {errorMessage && (
            <p
              id={messageId}
              className="text-input-helper text-status-error-fg"
            >
              {errorMessage}
            </p>
          )}
        </fieldset>
      )}
    </>
  );
}
