import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';

/** An address that never answers, so the page shows what a broken photo becomes without a request. */
const BROKEN_PHOTO = 'https://photo.invalid/tony.png';

export function PhotoAvatarEntry() {
  return (
    <ShowcaseEntry
      name="PhotoAvatar"
      level="molecule"
      origin="thrive"
      source="components/molecules/photo-avatar.tsx — composes Avatar"
      summary="Someone's photo, or their initials when there is none or it will not load."
      useFor="A person's face on its own: a stack of faces, the navbar, the start of a row. Beside their name, use AvatarName."
      avoidFor="Where the face stands alone, with no name beside it. Compose Avatar with an alt instead."
      usage={`import { PhotoAvatar } from '@/components/molecules/photo-avatar';

<PhotoAvatar name={member.name} photoUrl={member.photoUrl} size="sm" />`}
      props={[
        {
          name: 'name',
          type: 'string',
          description:
            'Whose face it is; their initials stand in for the photo.',
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
          description: '24, 32 or 40 px.',
        },
      ]}
      accessibility={[
        'Hidden from screen readers: the name beside it already says who it is.',
        'A photo that fails to load keeps the initials; there is never a broken image.',
      ]}
    >
      <StateCell label="No photo, by size">
        <PhotoAvatar name="Tony Stark" photoUrl={null} size="sm" />
        <PhotoAvatar name="Tony Stark" photoUrl={null} size="md" />
        <PhotoAvatar name="Tony Stark" photoUrl={null} />
      </StateCell>
      <StateCell label="A photo that will not load">
        <PhotoAvatar name="Tony Stark" photoUrl={BROKEN_PHOTO} />
      </StateCell>
      <StateCell label="One word">
        <PhotoAvatar name="Tony" photoUrl={null} />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function PhotoAvatarPreview() {
  return <PhotoAvatar name="Tony Stark" photoUrl={null} />;
}
