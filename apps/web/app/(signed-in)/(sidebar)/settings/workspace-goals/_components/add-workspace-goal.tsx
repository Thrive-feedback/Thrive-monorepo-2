'use client';

import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/atoms/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/dialog';
import { AddWorkspaceGoalForm } from './add-workspace-goal-form';

const ADD_A_WORKSPACE_GOAL = 'Add a Workspace Goal';

export type AddWorkspaceGoalProps = {
  /** The Workspace the page was drawn for; adding is refused once the person is no longer in it. */
  workspaceId: string;
};

/**
 * Add a Workspace Goal, at the end of the Goals card's title for an Admin, and the dialog it opens
 * with the form, as Invite people opens its own on Teammates. Adding one closes the dialog; its
 * toast names the new Goal, which is already in the list behind.
 */
export function AddWorkspaceGoal({ workspaceId }: AddWorkspaceGoalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outlined" size="sm" className="shrink-0">
          <PlusIcon aria-hidden="true" className="size-4" />
          {ADD_A_WORKSPACE_GOAL}
        </Button>
      </DialogTrigger>
      <DialogContent hasCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{ADD_A_WORKSPACE_GOAL}</DialogTitle>
          <DialogDescription>
            Members write it after # in their Feedback.
          </DialogDescription>
        </DialogHeader>
        <AddWorkspaceGoalForm
          workspaceId={workspaceId}
          onAdded={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
