import { Text } from '@/components/atoms/text';

export const TEAM_SIZES = ['Just me', '2–10', '11–50', '50+'] as const;

export type TeamSize = (typeof TEAM_SIZES)[number];

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
  return (
    <fieldset className="flex flex-col gap-2">
      <Text as="legend" variant="subtitle-4" className="mb-2">
        Team size (optional)
      </Text>
      <div className="flex flex-wrap gap-2">
        {TEAM_SIZES.map((size) => (
          <label
            key={size}
            className="relative rounded-inner border border-border-default bg-surface-base px-3 py-1.5 text-body-3 has-checked:border-action-primary has-checked:bg-action-primary-surface has-checked:text-fg-accent"
          >
            <input
              type="radio"
              name={name}
              value={size}
              checked={value === size}
              onChange={() => onChange(size)}
              className="absolute inset-0 cursor-pointer appearance-none rounded-inner"
            />
            {size}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
