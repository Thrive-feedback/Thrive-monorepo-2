import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Skeleton } from '@/components/atoms/skeleton';

export function SkeletonEntry() {
  return (
    <ShowcaseEntry
      name="Skeleton"
      level="atom"
      origin="shadcn"
      source="components/atoms/skeleton.tsx"
      summary="A grey placeholder in the shape of content that is still loading."
      useFor="A loading.tsx or Suspense fallback that keeps the layout from jumping. Export it beside the component it imitates; wrap a loading.tsx in SkeletonRegion."
      avoidFor="An action in progress. Use Button loading or a Spinner."
      usage={`import { Skeleton, SkeletonRegion } from '@/components/atoms/skeleton';

<SkeletonRegion>
  <div className="flex items-center gap-3">
    <Skeleton shape="circle" />
    <Skeleton className="w-40 text-subtitle-4" />
  </div>
</SkeletonRegion>`}
      props={[
        {
          name: 'shape',
          type: "'text' | 'circle' | 'control' | 'card'",
          defaultValue: "'text'",
          description:
            "What it stands in for — a line of text, an avatar, a button or field, a card — so its corners match what replaces it. Size it with className. A text line takes the type role of the line it replaces (text-subtitle-4), which makes it that line's height on every device.",
        },
        {
          name: '...rest',
          type: "ComponentProps<'div'>",
          description:
            'className sets the exact size of what it stands in for.',
        },
      ]}
      accessibility={[
        'Hidden from screen readers. Put aria-busy on the loading region instead: SkeletonRegion does, says Loading once, and makes everything inside it inert.',
        'The pulse stops for people who ask for reduced motion.',
      ]}
    >
      <StateCell label="Text">
        <div className="flex w-full flex-col gap-2">
          <Skeleton />
          <Skeleton className="w-2/3" />
        </div>
      </StateCell>
      <StateCell label="Circle">
        <Skeleton shape="circle" />
      </StateCell>
      <StateCell label="Control">
        <Skeleton shape="control" />
      </StateCell>
      <StateCell label="Card">
        <Skeleton shape="card" />
      </StateCell>
      <StateCell label="Composed: a Member row">
        <div className="flex w-full items-center gap-3">
          <Skeleton shape="circle" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="w-1/2" />
            <Skeleton className="w-1/3" />
          </div>
        </div>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function SkeletonPreview() {
  return (
    <div className="flex w-full items-center gap-3">
      <Skeleton shape="circle" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="w-3/4" />
        <Skeleton className="w-1/2" />
      </div>
    </div>
  );
}
