import { useId, useRef, useState } from 'react';
import { type TagRule, tagKeyOf, typedTriggerAt } from '@/lib/tag-text.util';

/** One thing a tag can be completed to. */
export type AutocompleteOption = {
  /** Written after the trigger's character when picked. */
  readonly value: string;
  /** What the suggestion reads as. */
  readonly label: string;
  /** What typing after the character is matched against, besides nothing at all. */
  readonly keywords: readonly string[];
};

/** How a highlighted tag and its suggestions are coloured. */
export type TagTone = 'accent' | 'secondary';

/** One kind of tag a field completes: how it is written, and what it can be completed to. */
export type AutocompleteTrigger = {
  readonly rule: TagRule;
  /** Names the list of suggestions to a screen reader. */
  readonly label: string;
  readonly tone: TagTone;
  readonly options: readonly AutocompleteOption[];
};

/** How many suggestions show at once; typing more narrows them. */
export const MAX_SUGGESTIONS = 8;

type TextField = HTMLInputElement | HTMLTextAreaElement;

type FieldHandlers<E extends TextField> = {
  readonly onChange?: React.ChangeEventHandler<E>;
  readonly onKeyDown?: React.KeyboardEventHandler<E>;
  readonly onSelect?: React.ReactEventHandler<E>;
  readonly onFocus?: React.FocusEventHandler<E>;
  readonly onBlur?: React.FocusEventHandler<E>;
};

/**
 * The options of `trigger` that `query` could be: those with a keyword holding it, ignoring
 * letter case, in the order given, at most `MAX_SUGGESTIONS`.
 */
function suggestionsFor(
  trigger: AutocompleteTrigger,
  query: string,
): readonly AutocompleteOption[] {
  const typed = tagKeyOf(query);
  return trigger.options
    .filter((option) =>
      option.keywords.some((keyword) => tagKeyOf(keyword).includes(typed)),
    )
    .slice(0, MAX_SUGGESTIONS);
}

/**
 * Writes `next` into the field the way typing would, so the field's own `onChange` hears it and a
 * controlled value follows. Setting `value` directly would be overwritten on the next render. The
 * caret is in place before it hears, so a field that limits its text knows what was just put in.
 */
function writeAsTyped(field: TextField, next: string, caret: number): void {
  const prototype = Object.getPrototypeOf(field) as object;
  Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(field, next);
  field.setSelectionRange(caret, caret);
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Suggests what a tag can be completed to while it is typed in a text field, and completes it.
 *
 * The suggestions belong to the tag the caret is in: typing `#` opens them, typing on narrows
 * them, and a space, Escape or leaving the field closes them. Escape closes them for that tag
 * only — typing in it again opens them again. Picking one, by Enter, Tab or a click, writes the
 * tag and a space to end it, through the field's own change event.
 *
 * Any arrow key moves through the suggestions while they are open — Right and Down to the next,
 * Left and Up to the one before, round from either end. Focus never leaves the field, and the
 * suggestion under the arrows is announced through `aria-activedescendant`.
 */
export function useTagAutocomplete<E extends TextField>(
  value: string,
  triggers: readonly AutocompleteTrigger[],
  handlers: FieldHandlers<E>,
) {
  const fieldRef = useRef<E>(null);
  const listId = useId();
  const [caret, setCaret] = useState(0);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // The tag the person closed, by where it starts and what was typed: the same tag typed on
  // is a new question and opens again.
  const [dismissed, setDismissed] = useState<string | null>(null);

  const typedTrigger = typedTriggerAt(
    value,
    caret,
    triggers.map((trigger) => trigger.rule),
  );
  const trigger = triggers.find(
    (candidate) => candidate.rule.char === typedTrigger?.char,
  );
  const suggestions =
    trigger && typedTrigger ? suggestionsFor(trigger, typedTrigger.query) : [];
  const typedKey = typedTrigger
    ? `${typedTrigger.start}:${typedTrigger.query}`
    : null;
  const open =
    focused &&
    trigger !== undefined &&
    suggestions.length > 0 &&
    typedKey !== dismissed;
  const active = Math.min(activeIndex, Math.max(suggestions.length - 1, 0));

  function optionId(index: number): string {
    return `${listId}-option-${index}`;
  }

  function followCaret(field: E): void {
    setCaret(field.selectionStart ?? field.value.length);
  }

  function pick(option: AutocompleteOption): void {
    const field = fieldRef.current;
    if (!field || !typedTrigger) {
      return;
    }
    // A space ends the tag, unless one already follows where it is written.
    const spacer = /\s/u.test(value.charAt(caret)) ? '' : ' ';
    const written = `${typedTrigger.char}${option.value}${spacer}`;
    const next =
      value.slice(0, typedTrigger.start) + written + value.slice(caret);
    writeAsTyped(field, next, typedTrigger.start + written.length);
    field.focus();
    const after = field.selectionStart ?? field.value.length;
    // A caret moved by script is not scrolled to, so a one-line field would hide what was just
    // written. At the end of the text, the end is where to look.
    if (after === field.value.length) {
      field.scrollLeft = field.scrollWidth;
    }
    setCaret(after);
    setActiveIndex(0);
  }

  // Only a one-line input may be a combobox; a textarea stays a textbox, which still carries
  // `aria-autocomplete` and `aria-activedescendant` but cannot say it is expanded.
  const comboboxProps = { role: 'combobox', 'aria-expanded': open } as const;

  const fieldProps = {
    ref: fieldRef,
    'aria-autocomplete': 'list',
    'aria-controls': open ? listId : undefined,
    'aria-activedescendant': open ? optionId(active) : undefined,
    onChange(event: React.ChangeEvent<E>) {
      // First, so a field that limits its text has put the caret where it stays.
      handlers.onChange?.(event);
      followCaret(event.currentTarget);
      setActiveIndex(0);
      setDismissed(null);
    },
    onSelect(event: React.SyntheticEvent<E>) {
      followCaret(event.currentTarget);
      handlers.onSelect?.(event);
    },
    onFocus(event: React.FocusEvent<E>) {
      setFocused(true);
      followCaret(event.currentTarget);
      handlers.onFocus?.(event);
    },
    onBlur(event: React.FocusEvent<E>) {
      setFocused(false);
      handlers.onBlur?.(event);
    },
    onKeyDown(event: React.KeyboardEvent<E>) {
      // An input method composing Thai or another script owns Enter until it commits.
      if (open && !event.nativeEvent.isComposing) {
        const count = suggestions.length;
        const picked = suggestions[active];
        // The chips sit in a row, so Left and Right move along it as Up and Down do; while they
        // are open, the caret stays where the tag is being typed.
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
          event.preventDefault();
          setActiveIndex((active + 1) % count);
          return;
        }
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
          event.preventDefault();
          setActiveIndex((active - 1 + count) % count);
          return;
        }
        if ((event.key === 'Enter' || event.key === 'Tab') && picked) {
          event.preventDefault();
          pick(picked);
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          setDismissed(typedKey);
          return;
        }
      }
      handlers.onKeyDown?.(event);
    },
  } as const;

  return {
    fieldRef,
    fieldProps,
    comboboxProps,
    open,
    listId,
    trigger,
    suggestions,
    active,
    optionId,
    setActiveIndex,
    pick,
  };
}
