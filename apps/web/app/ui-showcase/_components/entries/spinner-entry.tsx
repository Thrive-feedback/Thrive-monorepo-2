import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Spinner } from '@/components/atoms/spinner';

export function SpinnerEntry() {
  return (
    <ShowcaseEntry
      name="Spinner"
      level="atom"
      origin="shadcn"
      source="components/atoms/spinner.tsx"
      summary="Something is happening and will finish soon."
      useFor="A short wait with nothing to lay out yet."
      avoidFor="Inside a Button — pass loading instead. A page of content — use Skeleton."
      usage={`import { Spinner } from '@/components/atoms/spinner';

<Spinner />
<Spinner className="size-6 text-brand" />`}
      props={[
        {
          name: 'className',
          type: 'string',
          description: 'Size with size-*, colour with text-*.',
        },
        {
          name: '...rest',
          type: "ComponentProps<'svg'>",
          description: 'Any native svg prop.',
        },
      ]}
      accessibility={['Announced as a status named “Loading”.']}
    >
      <StateCell label="Sizes">
        <Spinner />
        <Spinner className="size-6" />
        <Spinner className="size-8 text-brand" />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function SpinnerPreview() {
  return <Spinner className="size-6 text-brand" />;
}
