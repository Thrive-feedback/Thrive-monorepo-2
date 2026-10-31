import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Avatar, AvatarFallback } from '@/components/atoms/avatar';
import { Badge } from '@/components/atoms/badge';
import { AvatarGroup } from '@/components/molecules/avatar-group';

const PEOPLE = ['TS', 'PP', 'HH', 'NR', 'SR', 'BB', 'CB'];

/** Named people, for the stack that names its own faces. */
const TEAM = [
  'Ann Lee',
  'Ben Carter',
  'Cara Diaz',
  'Dao Prasert',
  'Mali Sombat',
].map((name) => ({ id: name, name, photoUrl: null }));

// A function, not a component: the group counts its direct children, so the avatars have to
// arrive as an array rather than wrapped in one element.
function people(count: number, size?: 'sm' | 'md' | 'lg') {
  return PEOPLE.slice(0, count).map((initials) => (
    <Avatar key={initials} size={size}>
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  ));
}

export function AvatarGroupEntry() {
  return (
    <ShowcaseEntry
      name="AvatarGroup"
      level="molecule"
      origin="shadcn"
      source="components/molecules/avatar-group.tsx — composes Avatar"
      summary="Several people as one overlapping stack, with a count for the rest."
      useFor="Showing who is involved at a glance: the reviewers of a request, the members of a team."
      avoidFor="When each person needs a name beside them all the time. Use a list."
      usage={`import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/avatar';
import { AvatarGroup } from '@/components/molecules/avatar-group';

<AvatarGroup aria-label="Reviewers" max={3}>
  {reviewers.map((person) => (
    <Avatar key={person.id}>
      <AvatarImage src={person.photoUrl} alt={person.name} />
      <AvatarFallback>{person.initials}</AvatarFallback>
    </Avatar>
  ))}
</AvatarGroup>

// Names each face on hover, and lists everyone on a press.
<AvatarGroup people={reviewers} max={4} size="sm" listLabel="Show the reviewers" />`}
      props={[
        {
          name: 'aria-label',
          type: 'string',
          description: 'Names the group: "Reviewers", "Members".',
        },
        {
          name: 'max',
          type: 'number',
          description:
            'How many to show before the rest become a "+N" bubble. All show when unset.',
        },
        {
          name: 'size',
          type: "'sm' | 'md' | 'lg'",
          defaultValue: "'md'",
          description: "The bubble's size. Match the avatars you pass in.",
        },
        {
          name: 'children',
          type: 'Avatar[]',
          description: 'The people, in the order they should stack.',
        },
        {
          name: 'people',
          type: '{ id, name, photoUrl, label?, isMuted?, trailing? }[]',
          description:
            'Instead of children: the group draws the faces, each says its name on hover, and pressing the group lists everyone.',
        },
        {
          name: 'listTitle',
          type: 'string',
          description: "The list's title. Says how many people when unset.",
        },
        {
          name: 'listDescription',
          type: 'string',
          description: 'One sentence under the title.',
        },
        {
          name: 'listLabel',
          type: 'string',
          defaultValue: "'Show everyone'",
          description:
            'What pressing does, heard by a screen reader after the names.',
        },
      ]}
      accessibility={[
        'A group named by its aria-label, so the set is heard before each person.',
        'The "+N" bubble is announced as "N more".',
        'Each face has a ring in the page colour, so overlapping avatars stay apart.',
        'Given people, the stack is one button that speaks every name, and opens the list from the keyboard as from a click or a tap.',
      ]}
    >
      <StateCell
        label="Names on hover, list on press"
        hint="Hover a face for the name, the +1 for who it stands for. Press for everyone."
      >
        <AvatarGroup people={TEAM} max={4} size="sm" />
        <AvatarGroup people={TEAM} max={4} />
      </StateCell>
      <StateCell
        label="A list that says where each person stands"
        hint="Press for what `trailing` puts at the end of each row."
      >
        <AvatarGroup
          people={TEAM.map((person) => ({
            ...person,
            trailing: <Badge tone="success">Answered</Badge>,
          }))}
          max={4}
          size="sm"
        />
      </StateCell>
      <StateCell label="A few people">
        <AvatarGroup aria-label="Reviewers">{people(3)}</AvatarGroup>
      </StateCell>
      <StateCell label="More than max">
        <AvatarGroup aria-label="Members" max={4}>
          {people(7)}
        </AvatarGroup>
      </StateCell>
      <StateCell label="Sizes">
        <AvatarGroup aria-label="Small" max={3} size="sm">
          {people(5, 'sm')}
        </AvatarGroup>
        <AvatarGroup aria-label="Medium" max={3} size="md">
          {people(5, 'md')}
        </AvatarGroup>
      </StateCell>
      <StateCell label="One person">
        <AvatarGroup aria-label="Reviewer">{people(1)}</AvatarGroup>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function AvatarGroupPreview() {
  return (
    <AvatarGroup aria-label="Members" max={3}>
      {people(5, 'md')}
    </AvatarGroup>
  );
}
