'use client';

import { useLayoutEffect, useRef } from 'react';
import {
  Input,
  type InputProps,
  inputVariants,
} from '@/components/atoms/input';
import { cn } from '@/lib/cn.util';
import { TagHighlights } from './tag-highlights';
import { TagSuggestions } from './tag-suggestions';
import {
  type AutocompleteTrigger,
  useTagAutocomplete,
} from './use-tag-autocomplete';

export type AutocompleteInputProps = Omit<InputProps, 'value'> & {
  value: string;
  /** The kinds of tag it completes, each with what it can be completed to. */
  triggers: readonly AutocompleteTrigger[];
};

/**
 * An `Input` that completes tags as they are typed, the one-line sibling of
 * `AutocompleteTextarea`: chips above it offer what a tag can be, and every tag that names one is
 * coloured. A line longer than the box scrolls sideways, and the colour layer under it scrolls
 * with it.
 */
export function AutocompleteInput({
  value,
  triggers,
  variant,
  size,
  ref,
  className,
  onChange,
  onKeyDown,
  onSelect,
  onFocus,
  onBlur,
  onScroll,
  ...rest
}: AutocompleteInputProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const autocomplete = useTagAutocomplete<HTMLInputElement>(value, triggers, {
    onChange,
    onKeyDown,
    onSelect,
    onFocus,
    onBlur,
  });
  const { ref: fieldRef, ...fieldProps } = autocomplete.fieldProps;

  // An input scrolls to keep its caret in view without always saying so; follow it every render.
  useLayoutEffect(() => {
    if (backdropRef.current && fieldRef.current) {
      backdropRef.current.scrollLeft = fieldRef.current.scrollLeft;
    }
  });

  return (
    <div className="flex w-full flex-col">
      {autocomplete.open && autocomplete.trigger && (
        <TagSuggestions
          id={autocomplete.listId}
          trigger={autocomplete.trigger}
          suggestions={autocomplete.suggestions}
          active={autocomplete.active}
          optionId={autocomplete.optionId}
          onActiveChange={autocomplete.setActiveIndex}
          onPick={autocomplete.pick}
        />
      )}
      <div className="grid">
        <div
          ref={backdropRef}
          aria-hidden="true"
          data-slot="tag-highlights"
          // Mirrors the field's invalid look, which some variants draw as a fill.
          aria-invalid={rest['aria-invalid']}
          className={cn(
            inputVariants({ variant, size }),
            'col-start-1 row-start-1 overflow-hidden whitespace-pre border-transparent',
            className,
          )}
        >
          <TagHighlights text={value} triggers={triggers} />
        </div>
        <Input
          {...rest}
          {...fieldProps}
          {...autocomplete.comboboxProps}
          ref={(node) => {
            fieldRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          variant={variant}
          size={size}
          value={value}
          onScroll={(event) => {
            if (backdropRef.current) {
              backdropRef.current.scrollLeft = event.currentTarget.scrollLeft;
            }
            onScroll?.(event);
          }}
          className={cn(
            'col-start-1 row-start-1 bg-transparent text-transparent caret-fg-primary aria-invalid:bg-transparent',
            className,
          )}
        />
      </div>
    </div>
  );
}
