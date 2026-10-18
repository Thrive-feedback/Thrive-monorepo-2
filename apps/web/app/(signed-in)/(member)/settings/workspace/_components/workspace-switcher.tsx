'use client';

import { PlusIcon } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/atoms/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/dialog';
import { CreateWorkspaceForm } from '@/components/organisms/create-workspace-form';
import { WorkspaceList } from '@/components/organisms/workspace-list';
import type {
  MyWorkspace,
  MyWorkspaces,
} from '@/lib/workspace/my-workspace.type';
import {
  createAnotherWorkspace,
  switchWorkspace,
} from '@/lib/workspace/workspace-switch-actions.service';

export type WorkspaceSwitcherProps = {
  /** The Workspace this browser's session is in, marked in the list. */
  currentWorkspaceId: string;
  workspaces: MyWorkspaces;
};

/** What the dialog shows: the person's Workspaces, the question before switching, or the form. */
type View =
  | { readonly step: 'list' }
  | { readonly step: 'confirm'; readonly workspace: MyWorkspace }
  | { readonly step: 'create' };

const LIST: View = { step: 'list' };

/**
 * Switch Workspace, and the dialog it opens: the person's Workspaces (`WorkspaceList`), and Create
 * a Workspace, which turns the dialog into its form. It holds no Invitations: those are joined
 * from their own page.
 *
 * Choosing a Workspace asks first, since this device then closes the one it is in: every page is
 * drawn afresh on the chosen one's Home, which says once that it switched. The question says
 * "close" rather than "leave", which means Deactivating yourself here. Creating one lands on its
 * Home the same way, and its button says so.
 */
export function WorkspaceSwitcher({
  currentWorkspaceId,
  workspaces,
}: WorkspaceSwitcherProps) {
  const [view, setView] = useState<View>(LIST);
  const [isSwitching, startSwitching] = useTransition();
  const current = workspaces.active.find(
    (workspace) => workspace.id === currentWorkspaceId,
  );

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setView(LIST);
    }
  }

  function handleChoose(workspaceId: string) {
    const workspace = workspaces.active.find(({ id }) => id === workspaceId);
    if (workspace) {
      setView({ step: 'confirm', workspace });
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
        {view.step === 'create' && (
          <>
            <DialogHeader>
              <DialogTitle>Create a Workspace</DialogTitle>
              <DialogDescription>
                You&apos;ll be its first Admin, and keep the Workspaces you are
                in.
              </DialogDescription>
            </DialogHeader>
            <CreateWorkspaceForm
              action={createAnotherWorkspace}
              submitLabel="Create and jump to it"
            />
            <Button variant="ghost" onClick={() => setView(LIST)}>
              Back to your Workspaces
            </Button>
          </>
        )}
        {view.step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="break-all">
                Switch to “{view.workspace.name}”?
              </DialogTitle>
              <DialogDescription>
                {`You'll close “${current?.name ?? 'this Workspace'}” on this device and open “${view.workspace.name}”.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button disabled={isSwitching} onClick={() => setView(LIST)}>
                Not now
              </Button>
              <Button
                variant="primary"
                loading={isSwitching}
                onClick={() => handleSwitch(view.workspace.id)}
              >
                Open “{view.workspace.name}”
              </Button>
            </DialogFooter>
          </>
        )}
        {view.step === 'list' && (
          <>
            <DialogHeader>
              <DialogTitle>Switch Workspace</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <DialogDescription className="text-body-3">
                Switch to
              </DialogDescription>
              <WorkspaceList
                workspaces={workspaces}
                currentWorkspaceId={currentWorkspaceId}
                onChoose={handleChoose}
              />
            </div>
            <hr className="border-border-subtle" />
            <Button
              variant="outlined"
              className="w-full"
              onClick={() => setView({ step: 'create' })}
            >
              <PlusIcon aria-hidden="true" className="size-4" />
              Create a Workspace
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
