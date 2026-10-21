import { Badge } from '@/components/atoms/badge';
import type {
  AutocompleteOption,
  AutocompleteTrigger,
} from './use-tag-autocomplete';

export type TagSuggestionsProps = {
  id: string;
  trigger: AutocompleteTrigger;
  suggestions: readonly AutocompleteOption[];
  active: number;
  optionId: (index: number) => string;
  onActiveChange: (index: number) => void;
  onPick: (option: AutocompleteOption) => void;
};

/**
 * The suggestions for the tag being typed, as a row of badges above the field: the one the arrows
 * are on in the brand tone, the rest outlined. Focus stays in the
 * field the whole time — a chip is chosen with the arrow keys there, or clicked — so the chips are
 * never in the tab order, and a click on one does not take focus from the field.
 */
export function TagSuggestions({
  id,
  trigger,
  suggestions,
  active,
  optionId,
  onActiveChange,
  onPick,
}: TagSuggestionsProps) {
  return (
    <div
      id={id}
      role="listbox"
      aria-label={trigger.label}
      className="mb-2 flex flex-wrap gap-1.5 motion-safe:animate-enter"
    >
      {suggestions.map((option, index) => (
        <Badge
          key={option.value}
          asChild
          tone={index === active ? 'brand' : 'outline'}
          className="cursor-pointer gap-1.5 px-3 py-1 text-body-3"
        >
          {/* The keyboard picks from the field, which keeps focus: arrows move, Enter or Tab picks. */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: see above */}
          <div
            id={optionId(index)}
            role="option"
            aria-selected={index === active}
            tabIndex={-1}
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => onActiveChange(index)}
            onClick={() => onPick(option)}
          >
            <span>{option.label}</span>
            {option.detail && (
              <span className="text-fg-secondary">{option.detail}</span>
            )}
          </div>
        </Badge>
      ))}
    </div>
  );
}
