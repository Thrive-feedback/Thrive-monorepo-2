'use client';

import {
  MessageCircleQuestionMarkIcon,
  PenLineIcon,
  PlusIcon,
  SparklesIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import type { LetterSide } from '@/components/organisms/letter';
import { cn } from '@/lib/cn.util';
import styles from './compose-menu.module.css';

const CHOICES = [
  {
    side: 'request',
    label: 'Request feedback',
    Icon: MessageCircleQuestionMarkIcon,
  },
  { side: 'feedback', label: 'Give feedback', Icon: PenLineIcon },
] as const;

export type ComposeMenuProps = {
  /** The letter being written, checked in the menu. */
  writing: LetterSide;
  onChoose: (side: LetterSide) => void;
};

/**
 * "+": the kinds of letter there are to write, the one being written checked, and Kudo, which is
 * not ready. Choosing one closes the menu and leaves the cursor where the letter put it, rather
 * than taking it back to "+".
 */
export function ComposeMenu({ writing, onChoose }: ComposeMenuProps) {
  const [open, setOpen] = useState(false);
  const chose = useRef(false);

  function handleChoose(side: LetterSide) {
    chose.current = true;
    onChoose(side);
    setOpen(false);
  }

  function handleCloseAutoFocus(event: Event) {
    if (chose.current) {
      event.preventDefault();
      chose.current = false;
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="primary"
          size="icon"
          className={cn('size-12 shadow-high', styles.plus)}
        >
          <PlusIcon aria-hidden className="size-6" />
          <span className="sr-only">Write a letter</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={styles.menu}
        onCloseAutoFocus={handleCloseAutoFocus}
      >
        {CHOICES.map(({ side, label, Icon }) => (
          <DropdownMenuCheckboxItem
            key={side}
            checked={writing === side}
            onSelect={() => handleChoose(side)}
          >
            <Icon aria-hidden className="size-4.5 shrink-0" />
            {label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuItem disabled>
          <SparklesIcon aria-hidden className="size-4.5 shrink-0" />
          Kudo
          <Badge className="ms-auto">Soon</Badge>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
