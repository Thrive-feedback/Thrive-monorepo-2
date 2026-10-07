'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { Button } from '@/components/atoms/button';
import { THEME_STORAGE_KEY, type Theme } from '@/lib/theme.constant';

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => observer.disconnect();
}

function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function readServerTheme(): Theme {
  return 'light';
}

/**
 * Switches the page between the token layer's light and dark modes. The mode lives on
 * `<html data-theme>`, so nothing else learns a theme exists (`FE_03` R7); this only flips the
 * attribute and remembers the choice for the root layout's head script to apply next time.
 *
 * The state is read from the attribute rather than held here, because the head script may
 * already have set it before hydration. The server always renders the light state, and React
 * swaps in the attribute's value straight after hydrating.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, readServerTheme);
  const isDark = theme === 'dark';

  function handleClick() {
    const next: Theme = isDark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the mode still applies for this visit.
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Dark theme"
      aria-pressed={isDark}
      onClick={handleClick}
    >
      {isDark ? (
        <SunIcon aria-hidden="true" className="size-5" />
      ) : (
        <MoonIcon aria-hidden="true" className="size-5" />
      )}
    </Button>
  );
}
