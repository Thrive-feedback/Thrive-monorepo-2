import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Link } from '@/components/atoms/link';

const USAGE = `import { Link } from '@/components/atoms/link';

<Link href="/login">Sign in</Link>
<Link href="https://thrive.example/terms" external underline="always">
  Terms and Conditions
</Link>`;

export function LinkEntry() {
  return (
    <ShowcaseEntry
      name="Link"
      level="atom"
      origin="thrive"
      source="components/atoms/link.tsx"
      summary="Text that takes you somewhere. Next's client-side Link, painted with the link token."
      useFor="Navigation inside a sentence or a list — footer links, 'read more', a route in the app."
      avoidFor="Doing something on this page. That is a Button."
      usage={USAGE}
      props={[
        {
          name: 'href',
          type: 'string | UrlObject',
          description: 'Where it goes. Required.',
        },
        {
          name: 'underline',
          type: "'hover' | 'always'",
          defaultValue: "'hover'",
          description:
            'Always-underlined reads better inside running text, where colour alone is not enough.',
        },
        {
          name: 'external',
          type: 'boolean',
          defaultValue: 'false',
          description:
            'Opens a new tab with rel="noopener noreferrer", and says so to screen readers.',
        },
        {
          name: '...rest',
          type: 'ComponentProps<typeof NextLink>',
          description: 'prefetch, replace, scroll, ref, aria-* and the rest.',
        },
      ]}
      accessibility={[
        'Reached with Tab, followed with Enter.',
        'An external link is announced with “(opens in a new tab)”.',
      ]}
    >
      <StateCell label="Default" hint="Hover it">
        <Link href="/ui-showcase/tokens">Design tokens</Link>
      </StateCell>
      <StateCell label="Always underlined">
        <Link href="/ui-showcase/tokens" underline="always">
          Design tokens
        </Link>
      </StateCell>
      <StateCell label="Focused">
        <Link href="/ui-showcase/tokens" data-focus-preview>
          Design tokens
        </Link>
      </StateCell>
      <StateCell label="External">
        <Link href="https://ui.shadcn.com" external>
          shadcn/ui
        </Link>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function LinkPreview() {
  return <Link href="/ui-showcase">Privacy Policy</Link>;
}
