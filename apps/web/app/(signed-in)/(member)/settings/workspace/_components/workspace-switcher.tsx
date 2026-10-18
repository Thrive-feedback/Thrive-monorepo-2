'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { MyWorkspaces } from '@/app/(signed-in)/(member)/settings/workspace/_lib/my-workspace.type';
import {
  createAnotherWorkspace,
  switchWorkspace,
} from '@/app/(signed-in)/(member)/settings/workspace/_lib/workspace-switch-actions.service';
import { Button } from '@/components/atoms/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/dialog';
import { Text } from '@/components/atoms/text';
import { CreateWorkspaceForm } from '@/components/organisms/create-workspace-form';

export type WorkspaceSwitcherProps = {
  /** The Workspace the person is in now, marked in the list. */
  currentWorkspaceId: string;
  workspaces: MyWorkspaces;
};

/**
 * Switch Workspace, and the dialog it opens: the Workspaces the person is in, by name, the current
 * one marked; those they were Deactivated in, greyed out and not to be opened; and Create a
 * Workspace, which turns the dialog into its form (brain `ADR-0035`). Nothing in it says what Role
 * they have anywhere, and it holds no Invitations: those are joined from their own page.
 *
 * Choosing one, or creating one, keeps the person on Settings → Workspace, drawn again for the
 * Workspace they are now in; the page keys this on that Workspace, so the dialog starts closed.
 * The choices are disabled while a switch is on its way, so one click cannot become two.
 */
export function WorkspaceSwitcher({
  currentWorkspaceId,
  workspaces,
}: WorkspaceSwitcherProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isSwitching, startSwitching] = useTransition();

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setIsCreating(false);
    }
  }

  function handleSwitch(workspaceId: string) {
    startSwitching(async () => {
      const result = await switchWorkspace(workspaceId);
      toast.error(result.message);
    });
  }

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Switch Workspace
        </Button>
      </DialogTrigger>
      <DialogContent>
        {isCreating ? (
          <>
            <DialogHeader>
              <DialogTitle>Create a Workspace</DialogTitle>
              <DialogDescription>
                You&apos;ll be its first Admin, and keep the Workspaces you are
                in.
              </DialogDescription>
            </DialogHeader>
            <CreateWorkspaceForm action={createAnotherWorkspace} />
            <Button variant="ghost" onClick={() => setIsCreating(false)}>
              Back to your Workspaces
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Switch Workspace</DialogTitle>
              <DialogDescription>
                Every page, on every device, opens the Workspace you choose.
              </DialogDescription>
            </DialogHeader>
            <ul aria-label="Your Workspaces" className="flex flex-col gap-2">
              {workspaces.active.map((workspace) =>
                workspace.id === currentWorkspaceId ? (
                  <li
                    key={workspace.id}
                    aria-current="true"
                    className="flex items-center justify-between gap-2 rounded-element border border-border-default px-4 py-3"
                  >
                    <Text variant="body-2" className="break-all">
                      {workspace.name}
                    </Text>
                    <Text variant="body-3" tone="brand">
                      Current
                    </Text>
                  </li>
                ) : (
                  <li key={workspace.id}>
                    <Button
                      variant="secondary"
                      className="w-full justify-start break-all"
                      disabled={isSwitching}
                      onClick={() => handleSwitch(workspace.id)}
                    >
                      {workspace.name}
                    </Button>
                  </li>
                ),
              )}
              {workspaces.inactive.map((workspace) => (
                <li
                  key={workspace.id}
                  className="flex items-center justify-between gap-2 rounded-element border border-border-subtle px-4 py-3"
                >
                  <Text variant="body-2" tone="muted" className="break-all">
                    {workspace.name}
                  </Text>
                  <Text variant="body-3" tone="muted">
                    Inactive
                  </Text>
                </li>
              ))}
            </ul>
            <Button
              variant="outlined"
              disabled={isSwitching}
              onClick={() => setIsCreating(true)}
            >
              Create a Workspace
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
