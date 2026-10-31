import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { HandwrittenNote } from '@/components/atoms/handwritten-note';

export function HandwrittenNoteEntry() {
  return (
    <ShowcaseEntry
      name="HandwrittenNote"
      level="atom"
      origin="thrive"
      source="components/atoms/handwritten-note.tsx"
      summary="A teammate's note in the margin, in the handwriting face and the secondary colour."
      useFor="A small human aside beside a heading, on the landing page and Home."
      avoidFor="Anything a person needs to read: a screen reader skips it."
      usage={`import { HandwrittenNote } from '@/components/atoms/handwritten-note';

<HandwrittenNote size="md" tilt="left">say it while it's fresh</HandwrittenNote>`}
      props={[
        {
          name: 'tilt',
          type: "'left' | 'right'",
          defaultValue: "'right'",
          description: 'Which way it leans.',
        },
        {
          name: 'size',
          type: "'lg' | 'md'",
          defaultValue: "'lg'",
          description: '`lg` beside a display heading, `md` inside the app.',
        },
      ]}
      accessibility={[
        'Hidden from screen readers, so it must repeat nothing anyone needs.',
        'With reduced motion it is simply there rather than written on.',
      ]}
    >
      <StateCell label="Large, leaning right">
        <HandwrittenNote>not six months later</HandwrittenNote>
      </StateCell>
      <StateCell label="Medium, leaning left">
        <HandwrittenNote size="md" tilt="left">
          what your team's been saying
        </HandwrittenNote>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function HandwrittenNotePreview() {
  return <HandwrittenNote size="md">see you inside</HandwrittenNote>;
}
