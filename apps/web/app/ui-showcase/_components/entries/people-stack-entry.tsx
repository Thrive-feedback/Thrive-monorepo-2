import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { standInPhoto } from '@/app/ui-showcase/_lib/stand-in-photo.util';
import { PeopleStack } from '@/components/molecules/people-stack';

/** Made-up people: the showcase reaches no Workspace, and draws no real face. */
const PEOPLE = [
  {
    name: 'Tida Somsri',
    photoUrl: standInPhoto('#a78bfa', '#6d28d9'),
    inactive: false,
  },
  { name: 'Pim Prasert', photoUrl: null, inactive: false },
  {
    name: 'Hana Hoshi',
    photoUrl: standInPhoto('#fdba74', '#ea580c'),
    inactive: false,
  },
  {
    name: 'Nok Rattana',
    photoUrl: standInPhoto('#86efac', '#15803d'),
    inactive: false,
  },
  { name: 'Som Ruang', photoUrl: null, inactive: false },
];

export function PeopleStackEntry() {
  return (
    <ShowcaseEntry
      name="PeopleStack"
      level="molecule"
      origin="thrive"
      source="components/molecules/people-stack.tsx — composes AvatarGroup, PhotoAvatar"
      summary="Several people's faces as one overlapping stack, beside the names it stands for."
      useFor="Everyone else a piece of Feedback is for, beside their names on a row of Feedback for me."
      avoidFor="Choosing people, which is AvatarGroupButton. A feed card's Receivers, which is PeopleDialogButton: there the stack stands in for the names and opens them."
      usage={`import { PeopleStack } from '@/components/molecules/people-stack';

<PeopleStack people={item.receivers} />`}
      props={[
        {
          name: 'people',
          type: '{ name: string | null; photoUrl: string | null }[]',
          description:
            'Who it shows, in order: a photo, or initials without one.',
        },
        {
          name: 'size',
          type: "'sm' | 'md' | 'lg'",
          defaultValue: "'md'",
          description: 'The size of each face and of the "+N".',
        },
      ]}
      accessibility={[
        'Hidden from screen readers: it only ever sits beside the names it stands for.',
        'Answers no press and takes no focus.',
      ]}
    >
      <StateCell label="One person">
        <PeopleStack people={PEOPLE.slice(0, 1)} />
      </StateCell>
      <StateCell label="A few people">
        <PeopleStack people={PEOPLE.slice(0, 3)} />
      </StateCell>
      <StateCell label="More than four">
        <PeopleStack people={PEOPLE} />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function PeopleStackPreview() {
  return <PeopleStack people={PEOPLE} />;
}
