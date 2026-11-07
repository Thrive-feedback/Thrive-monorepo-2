'use client';

import { EllipsisIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  hideWorkspaceGoal,
  showWorkspaceGoal,
} from '@/app/(signed-in)/(sidebar)/settings/workspace-goals/_lib/workspace-goal-actions.service';
import { hashtagOf } from '@/app/(signed-in)/(sidebar)/settings/workspace-goals/_lib/workspace-goal-name.util';
import { Button } from '@/components/atoms/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';

export type WorkspaceGoalActionsProps = {
  /** The Workspace the page was drawn for; acting is refused once the person is no longer in it. */
  workspaceId: string;
  workspaceGoalId: string;
  /** Without the `#`. */
  name: string;
  /** Whether it is hidden now, which decides whether the menu hides or shows it. */
  isHidden: boolean;
};

/**
 * An Admin's hold on one Workspace Goal: one quiet menu, as a teammate's row has, whose one choice
 * hides it or shows it again. Each asks first and says what it changes — whether teammates are
 * offered it when they type `#` — and what it does not: Feedback that already uses it keeps it,
 * since a Workspace Goal is never deleted. Either can be undone with the other. A toast says it is
 * done, since the row only changes once the page is drawn again.
 */
export function WorkspaceGoalActions({
  workspaceId,
  workspaceGoalId,
  name,
  isHidden,
}: WorkspaceGoalActionsProps) {
  const [isAsking, setIsAsking] = useState(false);
  const [isChanging, startChanging] = useTransition();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const hashtag = hashtagOf(name);
  const verb = isHidden ? 'Show' : 'Hide';
  const Icon = isHidden ? EyeIcon : EyeOffIcon;

  function handleConfirm() {
    startChanging(async () => {
      const result = await (isHidden ? showWorkspaceGoal : hideWorkspaceGoal)(
        workspaceId,
        workspaceGoalId,
      );
      setIsAsking(false);
      if (result.ok) {
        toast.success(
          isHidden ? `${hashtag} is shown again` : `${hashtag} is hidden`,
        );
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="icon"
            aria-label={`Manage ${hashtag}`}
          >
            <EllipsisIcon aria-hidden="true" className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setIsAsking(true)}>
            <Icon aria-hidden="true" className="size-4" />
            {verb}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={isAsking} onOpenChange={setIsAsking}>
        <DialogContent
          hasCloseButton={false}
          onCloseAutoFocus={(event) => {
            // Its menu item is gone by then, so focus goes back to the menu's button.
            event.preventDefault();
            menuButtonRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle className="break-all">
              {isHidden ? `Show ${hashtag} again?` : `Hide ${hashtag}?`}
            </DialogTitle>
            <DialogDescription>
              {isHidden
                ? `Teammates can pick ${hashtag} again when they type #.`
                : `Teammates won't be offered ${hashtag} when they type #. Feedback that already uses it keeps it. You can show it again any time.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button disabled={isChanging}>Cancel</Button>
            </DialogClose>
            <Button
              variant="primary"
              loading={isChanging}
              onClick={handleConfirm}
            >
              {verb} {hashtag}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
