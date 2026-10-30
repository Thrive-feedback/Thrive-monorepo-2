import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Text } from '@/components/atoms/text';
import { AvatarName } from '@/components/molecules/avatar-name';

export function AvatarNameEntry() {
  return (
    <ShowcaseEntry
      name="AvatarName"
      level="molecule"
      origin="thrive"
      source="components/molecules/avatar-name.tsx — composes PhotoAvatar"
      summary="Someone's face beside their name, centred on each other."
      useFor="Anywhere a person's face sits next to their name: a card's opening line, the postcard's From, a list of Members, Settings."
      avoidFor="A face with no name beside it, or one standing at the start of a longer row. Use PhotoAvatar."
      usage={`import { AvatarName } from '@/components/molecules/avatar-name';

<AvatarName name={member.name} photoUrl={member.photoUrl} size="sm" />`}
      props={[
        {
          name: 'name',
          type: 'string',
          description:
            'Who it is: their initials stand in for the photo, and it is what shows unless replaced.',
        },
        {
          name: 'photoUrl',
          type: 'string | null',
          description: '`null` shows the initials.',
        },
        {
          name: 'size',
          type: "'sm' | 'md' | 'lg'",
          defaultValue: "'md'",
          description: 'The face: 24, 32 or 40 px. The gap follows it.',
        },
        {
          name: 'children',
          type: 'ReactNode',
          description:
            'What shows beside the face, where that is more than the name, such as an email under it.',
        },
      ]}
      accessibility={[
        'The face is hidden from screen readers, so the name is said once.',
      ]}
    >
      <StateCell label="By size">
        <AvatarName name="Tony Stark" photoUrl={null} size="sm" />
        <AvatarName name="Tony Stark" photoUrl={null} />
        <AvatarName name="Tony Stark" photoUrl={null} size="lg" />
      </StateCell>
      <StateCell label="With more than the name">
        <AvatarName name="Tony Stark" photoUrl={null} size="lg">
          <div className="flex flex-col">
            <Text as="span" variant="subtitle-4">
              Tony Stark
            </Text>
            <Text as="span" variant="body-3" tone="muted">
              tony@acme.test
            </Text>
          </div>
        </AvatarName>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function AvatarNamePreview() {
  return <AvatarName name="Tony Stark" photoUrl={null} />;
}
