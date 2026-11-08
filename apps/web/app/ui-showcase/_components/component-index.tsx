import {
  ATOMIC_LEVELS,
  COMPONENT_CATALOG,
} from '@/app/ui-showcase/_lib/component-catalog.constant';
import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import { ComponentSearch } from './component-search';
import { ShowcasePage } from './showcase-page';

/**
 * The showcase's front page: what it is and how to add to it, then every component, searchable.
 * Each preview is rendered here, on the server, and handed to the search as an element.
 */
export function ComponentIndex() {
  return (
    <ShowcasePage
      title="Components"
      description={
        <>
          <p>
            Every shared component a screen is built from. Open one to see each
            of its states, its props and the code to use it. Search here before
            building a new one, and take colours from the{' '}
            <Link href={ROUTES.uiShowcase.tokens}>design tokens</Link>.
          </p>
          <Text as="p" variant="body-2" tone="muted">
            Adding one from shadcn:{' '}
            <code className="text-fg-primary">
              cd apps/web &amp;&amp; bunx --bun shadcn@latest add &lt;name&gt;
            </code>
            , then swap its classes for token utilities — see{' '}
            <code className="text-fg-primary">docs/adr/0021</code>.
          </Text>
        </>
      }
    >
      <ComponentSearch
        levels={ATOMIC_LEVELS}
        cards={COMPONENT_CATALOG.map(({ slug, name, level, Preview }) => ({
          slug,
          name,
          level,
          preview: <Preview />,
        }))}
      />
    </ShowcasePage>
  );
}
