import {
  ATOMIC_LEVELS,
  COMPONENT_CATALOG,
} from '@/app/ui-showcase/_lib/component-catalog.constant';
import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { LevelBadge } from './level-badge';

/**
 * Each card is one link: its name stretches an invisible `::after` over the whole card, so
 * the card is clickable without wrapping live controls in an `<a>`, which HTML forbids and a
 * screen reader would read as one long link. The preview is `inert` — seen, never focused.
 */
export function ComponentIndex() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-12">
      <header className="flex flex-col gap-3">
        <Text variant="h5" as="h1">
          Components
        </Text>
        <Text tone="muted" className="max-w-2xl">
          Every shared component a screen is built from. Open one to see each of
          its states, its props and the code to use it. Search here before
          building a new one, and take colours from the{' '}
          <Link href="/ui-showcase/tokens">design tokens</Link>.
        </Text>
        <Text variant="body2" tone="muted">
          Adding one from shadcn:{' '}
          <code className="text-foreground">
            cd apps/web &amp;&amp; bunx --bun shadcn@latest add &lt;name&gt;
          </code>
          , then swap its classes for token utilities — see{' '}
          <code className="text-foreground">docs/adr/0021</code>.
        </Text>
      </header>

      {ATOMIC_LEVELS.map(({ level, title, folder, description }) => (
        <section
          key={level}
          aria-labelledby={`${level}-heading`}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <h2 id={`${level}-heading`} className="text-subtitle1">
              {title}{' '}
              <code className="font-normal text-body2 text-brand">
                {folder}
              </code>
            </h2>
            <Text variant="body2" tone="muted">
              {description}
            </Text>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMPONENT_CATALOG.filter((entry) => entry.level === level).map(
              ({ slug, name, level: entryLevel, Preview }) => (
                <li
                  key={slug}
                  className="relative flex flex-col overflow-hidden rounded-surface border border-line hover:border-line-strong hover:bg-surface-raised"
                >
                  <div
                    inert
                    className="flex min-h-32 flex-1 flex-wrap items-center justify-center gap-3 p-6"
                  >
                    <Preview />
                  </div>
                  <div className="flex items-center justify-between gap-2 border-line border-t bg-surface-raised px-4 py-3">
                    <Link
                      href={`/ui-showcase/${slug}`}
                      className="font-semibold text-foreground after:absolute after:inset-0"
                    >
                      {name}
                    </Link>
                    <LevelBadge level={entryLevel} />
                  </div>
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
    </main>
  );
}
