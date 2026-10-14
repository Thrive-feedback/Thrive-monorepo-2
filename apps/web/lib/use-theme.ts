'use client';

import { useSyncExternalStore } from 'react';
import {
  DARK_SCHEME_QUERY,
  THEME_STORAGE_KEY,
  type Theme,
  type ThemePreference,
} from '@/lib/theme.constant';

/** Raised on this tab when the choice changes; `storage` only fires in the other tabs. */
const PREFERENCE_EVENT = 'thrive:theme-preference';

function subscribeTheme(onChange: () => void): () => void {
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

function subscribePreference(onChange: () => void): () => void {
  window.addEventListener(PREFERENCE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(PREFERENCE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
}

function systemTheme(): Theme {
  return typeof matchMedia === 'function' &&
    matchMedia(DARK_SCHEME_QUERY).matches
    ? 'dark'
    : 'light';
}

/**
 * The mode in effect and the person's choice, and a way to change the choice. The mode is read
 * from `<html data-theme>` rather than held here, because the head script sets it before
 * hydration and keeps it in step with the operating system on `system` (`THEME_INIT_SCRIPT`).
 * The server renders the light mode and `system`, and React swaps in the real values straight
 * after hydrating.
 */
export function useTheme(): {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
} {
  const theme = useSyncExternalStore<Theme>(
    subscribeTheme,
    readTheme,
    () => 'light',
  );
  const preference = useSyncExternalStore<ThemePreference>(
    subscribePreference,
    readPreference,
    () => 'system',
  );

  function setPreference(next: ThemePreference) {
    document.documentElement.dataset.theme =
      next === 'system' ? systemTheme() : next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the mode still applies for this visit.
    }
    window.dispatchEvent(new Event(PREFERENCE_EVENT));
  }

  return { theme, preference, setPreference };
}
