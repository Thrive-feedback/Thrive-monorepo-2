import {
  ATOMIC_LEVELS,
  COMPONENT_CATALOG,
} from '@/app/ui-showcase/_lib/component-catalog.constant';
import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import { ComponentSearch } from './component-search';

/**
 * The showcase's front page: what it is and how to add to it, then every component, searchable.
 * Each preview is rendered here, on the server, and handed to the search as an element.
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
          <Link href={ROUTES.uiShowcase.tokens}>design tokens</Link>.
        </Text>
        <Text variant="body-2" tone="muted">
          Adding one from shadcn:{' '}
          <code className="text-fg-primary">
            cd apps/web &amp;&amp; bunx --bun shadcn@latest add &lt;name&gt;
          </code>
          , then swap its classes for token utilities — see{' '}
          <code className="text-fg-primary">docs/adr/0021</code>.
        </Text>
      </header>

      <ComponentSearch
        levels={ATOMIC_LEVELS}
        cards={COMPONENT_CATALOG.map(({ slug, name, level, Preview }) => ({
          slug,
          name,
          level,
          preview: <Preview />,
        }))}
      />
    </main>
  );
}
