'use client';

import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';

const CHOICES = [
  {
    title: 'Ask for feedback',
    description: 'Ask teammates what they think.',
  },
  {
    title: 'Give feedback',
    description: "Tell a teammate what you've seen.",
  },
  {
    title: 'Give kudos',
    description: 'Say well done in a few words.',
  },
] as const;

/**
 * "+": the three things to write, each with a line on what it is for. None is built on the new
 * Home yet, so choosing one only closes the menu.
 */
export function ComposeMenu() {
  return (
    <DropdownMenu>
      {/* The trigger rounds whatever it wraps into a pill; this is a full-width bar, so it keeps
          the button's own corners, the same as the sidebar's items below it. */}
      <DropdownMenuTrigger asChild className="rounded-button">
        <Button variant="secondary" className="w-full">
          <PlusIcon aria-hidden="true" className="size-5" />
          <span className="sr-only">Write something</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {CHOICES.map(({ title, description }) => (
          <DropdownMenuItem
            key={title}
            className="flex-col items-start gap-0.5 px-3 py-2.5"
          >
            <span className="text-fg-primary text-subtitle-4">{title}</span>
            <span className="text-body-3 text-fg-secondary">{description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
