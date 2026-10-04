import { useTranslations } from 'next-intl';
import { Text } from '@/components/atoms/text';

/**
 * The value is what the form keeps; the label is worded per language. Bounds are numbers so
 * each language formats them its own way.
 */
const TEAM_SIZE_OPTIONS = [
  { value: 'just-me' },
  { value: '2-10', min: 2, max: 10 },
  { value: '11-50', min: 11, max: 50 },
  { value: '50+', min: 50 },
] as const;

export type TeamSize = (typeof TEAM_SIZE_OPTIONS)[number]['value'];

export type TeamSizeOptionsProps = {
  name: string;
  value: TeamSize | null;
  onChange: (value: TeamSize) => void;
};

/**
 * Native radios, so the group gets one tab stop and arrow-key choice for free. Each radio has
 * no appearance of its own and is laid over its whole pill, which puts the focus ring around
 * the pill and makes the pill the click target.
 */
export function TeamSizeOptions({
  name,
  value,
  onChange,
}: TeamSizeOptionsProps) {
  const t = useTranslations('CreateWorkspace');

  function labelFor(option: (typeof TEAM_SIZE_OPTIONS)[number]): string {
    if (!('min' in option)) {
      return t('teamSizeJustMe');
    }
    return 'max' in option
      ? t('teamSizeRange', { min: option.min, max: option.max })
      : t('teamSizeAtLeast', { min: option.min });
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <Text as="legend" variant="subtitle4" className="mb-2">
        {t('teamSize')}
      </Text>
      <div className="flex flex-wrap gap-2">
        {TEAM_SIZE_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="relative rounded-indicator border border-line bg-surface px-3 py-1.5 text-body3 has-checked:border-action has-checked:bg-action-subtle has-checked:text-brand"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="absolute inset-0 cursor-pointer appearance-none rounded-indicator"
            />
            {labelFor(option)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
