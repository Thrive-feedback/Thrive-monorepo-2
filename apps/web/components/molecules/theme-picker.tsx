'use client';

import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { ButtonGroup } from '@/components/atoms/button-group';
import type { ThemePreference } from '@/lib/theme.constant';
import { useTheme } from '@/lib/use-theme';

const OPTIONS: readonly {
  readonly value: ThemePreference;
  readonly label: string;
  readonly Icon: typeof SunIcon;
}[] = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon },
];

/**
 * The person's choice of colour mode: light, dark, or whatever their operating system uses. One
 * button is pressed at a time, the chosen one in the primary colour, like Home's groups.
 */
export function ThemePicker() {
  const { preference, setPreference } = useTheme();

  return (
    <ButtonGroup aria-label="Theme">
      {OPTIONS.map(({ value, label, Icon }) => (
        <Button
          key={value}
          variant={preference === value ? 'primary' : 'secondary'}
          size="sm"
          aria-pressed={preference === value}
          prefixIcon={<Icon aria-hidden="true" className="size-4" />}
          onClick={() => setPreference(value)}
        >
          {label}
        </Button>
      ))}
    </ButtonGroup>
  );
}
