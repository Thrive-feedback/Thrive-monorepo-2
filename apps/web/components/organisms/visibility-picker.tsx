import { useId } from 'react';
import { Checkbox } from '@/components/atoms/checkbox';
import { Label } from '@/components/atoms/label';
import { RadioGroup, RadioGroupItem } from '@/components/atoms/radio-group';
import { Skeleton } from '@/components/atoms/skeleton';
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
  /**
   * Where the error is already said, by element id. Given, the picker marks the people invalid
   * and points at it rather than saying it a second time.
   */
  errorId?: string;
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
  errorId,
  onValueChange,
  onSelectedChange,
  ref,
}: VisibilityPickerProps<Value>) {
  const id = useId();
  const messageId = errorId ?? `${id}-message`;

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
          className="flex flex-col gap-2 border-border-subtle border-t pt-3"
        >
          <Text as="legend" variant="label" className="float-left mb-2 w-full">
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
          {errorMessage && !errorId && (
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
