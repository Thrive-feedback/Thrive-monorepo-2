import { Badge, type BadgeTone } from '@/components/atoms/badge';
import { cn } from '@/lib/cn.util';
import type {
  AutocompleteOption,
  AutocompleteTrigger,
  TagTone,
} from './use-tag-autocomplete';

/**
 * Each kind of tag's badge, in the colour it takes in the text once picked: a Workspace Goal's `#`
 * in info blue, a teammate's `@` in the orange of the human voice. The words take the tone's own
 * colour, as the tag does in text, rather than the near-black a Badge's tone gives them, so the
 * colour reads at the badges' small size.
 */
const SUGGESTION_TONES: Readonly<
  Record<TagTone, { tone: BadgeTone; ink: string }>
> = {
  info: { tone: 'info', ink: 'text-status-info-active' },
  secondary: { tone: 'highlight', ink: 'text-action-secondary' },
};

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
      className="mb-3 flex flex-wrap gap-1 motion-safe:animate-enter"
    >
      {suggestions.map((option, index) => (
        <Badge
          key={option.value}
          asChild
          tone={SUGGESTION_TONES[trigger.tone].tone}
          edged={index === active}
          className={cn('cursor-pointer', SUGGESTION_TONES[trigger.tone].ink)}
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
            {option.label}
          </div>
        </Badge>
      ))}
    </div>
  );
}
