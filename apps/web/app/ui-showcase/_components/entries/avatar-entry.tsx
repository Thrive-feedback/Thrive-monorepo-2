import { UserIcon } from 'lucide-react';
import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/avatar';

export function AvatarEntry() {
  return (
    <ShowcaseEntry
      name="Avatar"
      level="atom"
      origin="shadcn"
      source="components/atoms/avatar.tsx — Avatar, AvatarImage, AvatarFallback"
      summary="A Member's photo, with their initials or an icon until it loads — or if it never does."
      useFor="Showing who someone is next to their name."
      avoidFor="Logos or decorative images. Use next/image."
      usage={`import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/avatar';

<Avatar size="md">
  <AvatarImage src={member.photoUrl} alt={member.displayName} />
  <AvatarFallback>{initials(member.displayName)}</AvatarFallback>
</Avatar>`}
      props={[
        {
          name: 'size',
          type: "'sm' | 'md' | 'lg'",
          defaultValue: "'lg'",
          description: '24, 32 or 40 px.',
        },
        {
          name: 'shape',
          type: "'circle' | 'rounded' | 'square'",
          defaultValue: "'circle'",
          description: 'Circle for people; rounded or square for Workspaces.',
        },
        {
          name: 'AvatarImage src / alt',
          type: 'string',
          description: 'The photo, and the person’s name as its alternative.',
        },
        {
          name: 'AvatarFallback delayMs',
          type: 'number',
          description:
            'Wait before showing the fallback, so a fast photo does not flash initials.',
        },
      ]}
      accessibility={[
        'The photo’s alt is the person’s name.',
        'When the name is already written beside it, the fallback initials are repeated text: consider aria-hidden on the Avatar.',
      ]}
    >
      <StateCell label="Initials, by size">
        <Avatar size="sm">
          <AvatarFallback>TS</AvatarFallback>
        </Avatar>
        <Avatar size="md">
          <AvatarFallback>TS</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>TS</AvatarFallback>
        </Avatar>
      </StateCell>
      <StateCell label="Shapes">
        <Avatar shape="circle">
          <AvatarFallback>OP</AvatarFallback>
        </Avatar>
        <Avatar shape="rounded">
          <AvatarFallback>OP</AvatarFallback>
        </Avatar>
        <Avatar shape="square">
          <AvatarFallback>OP</AvatarFallback>
        </Avatar>
      </StateCell>
      <StateCell label="Icon fallback">
        <Avatar>
          <AvatarFallback>
            <UserIcon aria-hidden="true" className="size-5" />
          </AvatarFallback>
        </Avatar>
      </StateCell>
      <StateCell label="Photo" hint="Falls back to initials if it fails">
        <Avatar>
          <AvatarImage src="/brand/google-g.svg" alt="Google" />
          <AvatarFallback>G</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src="/does-not-exist.png" alt="Tony Stark" />
          <AvatarFallback>TS</AvatarFallback>
        </Avatar>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function AvatarPreview() {
  return (
    <>
      <Avatar size="sm">
        <AvatarFallback>TS</AvatarFallback>
      </Avatar>
      <Avatar size="md">
        <AvatarFallback>TS</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>TS</AvatarFallback>
      </Avatar>
    </>
  );
}
