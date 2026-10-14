'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { useTheme } from '@/lib/use-theme';

/**
 * Switches the page between the token layer's light and dark modes, for the pages that have no
 * Settings to choose in. The mode lives on `<html data-theme>`, so nothing else learns a theme
 * exists (`FE_03` R7). It flips the mode in effect — whatever the operating system gave on
 * `system` — and remembers the opposite as an explicit choice.
 */
export function ThemeToggle() {
  const { theme, setPreference } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Dark theme"
      aria-pressed={isDark}
      className="text-action-primary enabled:active:bg-action-primary-surface-hover enabled:hover:bg-action-primary-surface-hover aria-pressed:text-action-secondary aria-pressed:enabled:active:bg-action-secondary-surface-hover aria-pressed:enabled:hover:bg-action-secondary-surface-hover"
      onClick={() => setPreference(isDark ? 'light' : 'dark')}
    >
      {isDark ? (
        <SunIcon aria-hidden="true" className="size-5" />
      ) : (
        <MoonIcon aria-hidden="true" className="size-5" />
      )}
    </Button>
  );
}
