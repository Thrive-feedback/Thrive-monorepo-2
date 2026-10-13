import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { Avatar, AvatarFallback } from '@/components/atoms/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';

function AccountItems() {
  return (
    <DropdownMenuContent>
      <DropdownMenuLabel>ann@acme.test</DropdownMenuLabel>
      <DropdownMenuItem>Profile</DropdownMenuItem>
      <DropdownMenuItem>Settings</DropdownMenuItem>
      <DropdownMenuItem disabled>Billing</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Sign out</DropdownMenuItem>
    </DropdownMenuContent>
  );
}

export function DropdownMenuEntry() {
  return (
    <ShowcaseEntry
      name="DropdownMenu"
      level="atom"
      origin="shadcn"
      source="components/atoms/dropdown-menu.tsx — DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem…"
      summary="A short list of actions or places, opened from one button."
      useFor="Actions that belong to one thing but would crowd the screen, such as the account menu."
      avoidFor="Choosing a value for a form (Select) or the main navigation."
      usage={`import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger aria-label="Account">
    <Avatar size="md"><AvatarFallback>AB</AvatarFallback></Avatar>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`}
      props={[
        {
          name: 'open / defaultOpen / onOpenChange',
          type: 'boolean / (open: boolean) => void',
          description: 'Whether the menu is open, controlled or uncontrolled.',
        },
        {
          name: 'DropdownMenuContent align',
          type: "'start' | 'center' | 'end'",
          defaultValue: "'end'",
          description: 'Which edge of the trigger the menu lines up with.',
        },
        {
          name: 'DropdownMenuItem onSelect',
          type: '(event: Event) => void',
          description: 'Runs the item; the menu then closes.',
        },
        {
          name: 'DropdownMenuItem asChild',
          type: 'boolean',
          description: 'Paint a Link or a submit button as the item.',
        },
        {
          name: 'DropdownMenuItem disabled',
          type: 'boolean',
          defaultValue: 'false',
          description: 'An item that cannot be picked now.',
        },
      ]}
      accessibility={[
        'The trigger is a button that says it opens a menu; Enter, Space or Down opens it.',
        'The arrows move through items, typing jumps to one, Escape closes and returns focus.',
        'Give an icon-only trigger an aria-label.',
      ]}
    >
      <StateCell label="Avatar trigger" hint="Open it">
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Account">
            <Avatar size="md">
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <AccountItems />
        </DropdownMenu>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function DropdownMenuPreview() {
  return (
    <Avatar size="md">
      <AvatarFallback>AB</AvatarFallback>
    </Avatar>
  );
}
