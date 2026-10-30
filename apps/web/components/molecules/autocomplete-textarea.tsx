'use client';

import { cva } from 'class-variance-authority';
import { useRef } from 'react';
import {
  Textarea,
  type TextareaProps,
  textareaVariants,
} from '@/components/atoms/textarea';
import { cn } from '@/lib/cn.util';
import { TagHighlights } from './tag-highlights';
import { TagSuggestions } from './tag-suggestions';
import {
  type AutocompleteTrigger,
  useTagAutocomplete,
} from './use-tag-autocomplete';

export type AutocompleteTextareaProps = Omit<TextareaProps, 'value'> & {
  value: string;
  /** The kinds of tag it completes, each with what it can be completed to. */
  triggers: readonly AutocompleteTrigger[];
  /** Fills the height of a flex column and scrolls inside it, rather than growing with the text. */
  fill?: boolean;
  /**
   * Classes for the drawn text alone, such as its colour: the box itself stays transparent, so
   * that the tags can be coloured under it.
   */
  textClassName?: string;
};

const frame = cva('flex w-full flex-col', {
  variants: { fill: { true: 'min-h-0 flex-1', false: '' } },
  defaultVariants: { fill: false },
});

const layers = cva('grid', {
  variants: { fill: { true: 'min-h-0 flex-1 grid-rows-1', false: '' } },
  defaultVariants: { fill: false },
});

/**
 * A `Textarea` that completes tags as they are typed — `#` and a name, say — offering what each
 * can be, in chips above the box, and colouring every tag that names one. It is controlled:
 * completing a tag goes through `onChange` like typing does.
 *
 * The colour is a layer under the box, which keeps its own text transparent, drawn in the box's
 * exact metrics. Both sit in one grid cell, so they grow together as lines are added.
 */
export function AutocompleteTextarea({
  value,
  triggers,
  fill = false,
  textClassName,
  ref,
  className,
  onChange,
  onKeyDown,
  onSelect,
  onFocus,
  onBlur,
  onScroll,
  ...rest
}: AutocompleteTextareaProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const autocomplete = useTagAutocomplete<HTMLTextAreaElement>(
    value,
    triggers,
    { onChange, onKeyDown, onSelect, onFocus, onBlur },
  );
  const { ref: fieldRef, ...fieldProps } = autocomplete.fieldProps;

  return (
    <div className={frame({ fill })}>
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
      <div className={layers({ fill })}>
        <div
          ref={backdropRef}
          aria-hidden="true"
          data-slot="tag-highlights"
          className={cn(
            textareaVariants(),
            'col-start-1 row-start-1 block overflow-hidden whitespace-pre-wrap break-words border-transparent',
            className,
            textClassName,
          )}
        >
          <TagHighlights text={value} triggers={triggers} />
        </div>
        <Textarea
          {...rest}
          {...fieldProps}
          ref={(node) => {
            fieldRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          value={value}
          onScroll={(event) => {
            if (backdropRef.current) {
              backdropRef.current.scrollTop = event.currentTarget.scrollTop;
            }
            onScroll?.(event);
          }}
          className={cn(
            'col-start-1 row-start-1 bg-transparent text-transparent caret-fg-primary',
            className,
          )}
        />
      </div>
    </div>
  );
}
