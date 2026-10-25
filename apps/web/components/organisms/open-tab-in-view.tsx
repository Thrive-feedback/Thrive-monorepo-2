'use client';

import { useEffect, useRef } from 'react';

/**
 * Keeps the open tab of a sideways-scrolling strip in view: on a phone the strip is wider than
 * the screen, and a tab opened from an address would otherwise sit off its edge with only a stub
 * of its underline showing. It scrolls the strip alone, never the page. Drawn inside the strip,
 * keyed by the open tab, so it runs again whenever that changes.
 */
export function OpenTabInView() {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const strip = markerRef.current?.closest('nav');
    const open = strip?.querySelector(
      '[aria-current="page"], [aria-pressed="true"]',
    );
    if (!strip || !open) {
      return;
    }
    const stripBox = strip.getBoundingClientRect();
    const openBox = open.getBoundingClientRect();
    strip.scrollLeft +=
      openBox.left - stripBox.left - (stripBox.width - openBox.width) / 2;
  }, []);

  return <span ref={markerRef} hidden />;
}
