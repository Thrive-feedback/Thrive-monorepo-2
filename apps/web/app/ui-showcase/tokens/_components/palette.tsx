'use client';

import { useEffect, useState } from 'react';
import { Text } from '@/components/atoms/text';

const STEPS = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  '950',
] as const;

const RAMPS = [
  { name: 'primary', extraSteps: ['750'] },
  { name: 'secondary', extraSteps: [] },
  { name: 'neutral', extraSteps: [] },
  { name: 'success', extraSteps: [] },
  { name: 'caution', extraSteps: [] },
  { name: 'danger', extraSteps: [] },
  { name: 'info', extraSteps: [] },
] as const;

function stepsOf(extraSteps: readonly string[]): string[] {
  return [...STEPS, ...extraSteps].sort((a, b) => Number(a) - Number(b));
}

/**
 * The primitive ramps, as the design's colour page lays them out. This is the one place that
 * paints a primitive directly: it documents the palette, so each swatch is the value itself, set
 * as an inline custom property. Screens never do this — the theme exposes no primitive utility,
 * and a component reaches colour only through the semantic roles below (FE_03 R2).
 *
 * Values are read from the page once it has loaded, so they are always the ones the token
 * files ship rather than a copy that could drift.
 */
export function Palette() {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const read: Record<string, string> = {};
    for (const { name, extraSteps } of RAMPS) {
      for (const step of stepsOf(extraSteps)) {
        read[`${name}-${step}`] = styles
          .getPropertyValue(`--${name}-${step}`)
          .trim();
      }
    }
    setValues(read);
  }, []);

  return (
    <section aria-labelledby="palette-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Text variant="subtitle1" as="h2" id="palette-heading">
          Palette
        </Text>
        <Text variant="body2" tone="muted">
          The primitive ramps behind every role, 50 to 950 as in the design.
          Components never use these directly — pick a role from the sections
          below. The number is the step; hover a swatch for its value.
        </Text>
      </div>
      <div className="flex flex-col gap-3">
        {RAMPS.map(({ name, extraSteps }) => (
          <div
            key={name}
            className="flex flex-col gap-1 md:flex-row md:items-center md:gap-4"
          >
            <Text as="span" variant="subtitle4" className="capitalize md:w-24">
              {name}
            </Text>
            <ul className="grid flex-1 grid-cols-6 gap-1 sm:grid-cols-12">
              {stepsOf(extraSteps).map((step) => {
                const token = `${name}-${step}`;
                return (
                  <li
                    key={token}
                    title={`--${token}: ${values[token] ?? ''}`}
                    className="flex flex-col overflow-hidden rounded-control border border-line"
                  >
                    <span
                      className="h-10"
                      style={{ backgroundColor: `var(--${token})` }}
                    />
                    <code className="px-1 py-0.5 text-center text-caption">
                      {step}
                    </code>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
