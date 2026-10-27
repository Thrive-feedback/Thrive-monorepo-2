import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { standInPhoto } from '@/app/ui-showcase/_lib/stand-in-photo.util';
import { PeopleStack } from '@/components/molecules/people-stack';
import { FeedbackCard } from '@/components/organisms/feedback-card';
import type { FeedItem } from '@/lib/feedback/feed-item.type';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';

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

const FOR_SEVERAL: FeedItem = {
  id: 'showcase-feedback',
  giverName: 'Ben Boon',
  giverPhotoUrl: standInPhoto('#7dd3fc', '#0369a1'),
  giverInactive: false,
  receivers: PEOPLE.slice(0, 3),
  origin: 'OFFERED',
  message:
    'You three kept the demo calm when the build broke. Keep running the dry run the day before.',
  messageTags: NO_TEXT_TAGS,
  givenAt: '2026-10-27T03:00:00.000Z',
  reactions: { '👏': ['Pim Prasert'] },
};

export function PeopleStackEntry() {
  return (
    <ShowcaseEntry
      name="PeopleStack"
      level="molecule"
      origin="thrive"
      source="components/molecules/people-stack.tsx — composes AvatarGroup, PhotoAvatar"
      summary="Several people's faces as one overlapping stack, beside the names it stands for."
      useFor="Everyone a piece of Feedback is for, closing a feed card or a My Activity row."
      avoidFor="Choosing people. Use AvatarGroupButton, which draws the same stack as a button."
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
          description:
            'The size of each face and of the "+N". The default matches the face that leads a feed card.',
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
      <StateCell label="Closing a feed card for several people">
        <div className="w-full max-w-md">
          <FeedbackCard item={FOR_SEVERAL} />
        </div>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function PeopleStackPreview() {
  return <PeopleStack people={PEOPLE} />;
}
