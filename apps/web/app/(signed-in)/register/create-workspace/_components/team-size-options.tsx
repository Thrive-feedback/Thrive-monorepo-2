import {
  TEAM_SIZES,
  type TeamSize,
} from '@/app/(signed-in)/register/create-workspace/_lib/team-size.constant';
import { Text } from '@/components/atoms/text';

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
            key={size.value}
            className="relative rounded-inner border border-border-default bg-surface-base px-3 py-1.5 text-body-3 has-checked:border-action-primary has-checked:bg-action-primary-surface has-checked:text-fg-accent"
          >
            <input
              type="radio"
              name={name}
              value={size.value}
              checked={value === size.value}
              onChange={() => onChange(size.value)}
              className="absolute inset-0 cursor-pointer appearance-none rounded-inner"
            />
            {size.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
