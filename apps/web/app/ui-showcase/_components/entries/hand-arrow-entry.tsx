import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { HandArrow } from '@/components/atoms/hand-arrow';

export function HandArrowEntry() {
  return (
    <ShowcaseEntry
      name="HandArrow"
      level="atom"
      origin="thrive"
      source="components/atoms/hand-arrow.tsx — one inline SVG, drawn in the colour of the words around it."
      summary="An arrow drawn by hand, for a handwritten note to point at something."
      useFor="A note saying what something is or how to use it: an Ask's small postcard, or a tool on a card being written."
      avoidFor="A control or anything a person must read: use an icon. It is decoration."
      usage={`import { HandArrow } from '@/components/atoms/hand-arrow';

<HandArrow className="h-4 w-8 rotate-90" />`}
      props={[
        {
          name: 'className',
          type: 'string',
          description:
            'Its size, and a turn or a flip to point anywhere but right.',
        },
      ]}
      accessibility={['Hidden from screen readers: it only points the way.']}
    >
      <StateCell label="Pointing right">
        <HandArrow className="text-action-secondary-hover" />
      </StateCell>
      <StateCell label="Turned to point down">
        <HandArrow className="rotate-90 text-action-secondary-hover" />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function HandArrowPreview() {
  return <HandArrow className="text-action-secondary-hover" />;
}
