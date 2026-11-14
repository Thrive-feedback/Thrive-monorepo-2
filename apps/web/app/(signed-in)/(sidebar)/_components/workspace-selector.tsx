'use client';

import { ChevronDownIcon, PlusIcon } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { Text } from '@/components/atoms/text';
import { CreateWorkspaceForm } from '@/components/organisms/create-workspace-form';
import { cn } from '@/lib/cn.util';
import type {
  MyWorkspace,
  MyWorkspaces,
} from '@/lib/workspace/my-workspace.type';
import {
  createAnotherWorkspace,
  switchWorkspace,
} from '@/lib/workspace/workspace-switch-actions.service';
import styles from './workspace-selector.module.css';

export type WorkspaceSelectorProps = {
  /** The Workspace this browser's session is in. */
  current: MyWorkspace;
  workspaces: MyWorkspaces;
};

/**
 * The Workspace the person is in, beside the logo, by its name. With nowhere else to go
 * it is only that. With another Workspace to open, it is a quiet button: the name alone at rest,
 * then a muted chevron after it and a soft ground while pointed at, focused or open (always on a
 * touch screen, which has no pointing), and its menu lists them as the switcher does (brain
 * `ADR-0041` decision 5): each by name in the display face, the current one ticked on the
 * product's light purple, the rest opened at once on their Home, those the person was
 * Deactivated in greyed and closed, then Create a Workspace, whose form opens in a dialog.
 *
 * A choice keeps the menu open while it is on its way, so one click cannot become two; a refusal
 * says why in a toast, and success draws every page afresh in the chosen Workspace.
 */
export function WorkspaceSelector({
  current,
  workspaces,
}: WorkspaceSelectorProps) {
  const [creating, setCreating] = useState(false);
  const [isSwitching, startSwitching] = useTransition();
  const others = workspaces.active.filter(({ id }) => id !== current.id);

  // Set in the display face and the primary colour, on the wordmark's baseline and at its size on
  // every screen, so "Thrive × Acme" reads as one lockup. On a phone the button around it gives
  // up its spare padding instead, and a name too long for the bar ends in an ellipsis.
  const identity = (
    <Text
      as="span"
      variant="display-4"
      className={cn(
        'max-w-36 truncate text-action-primary sm:max-w-80',
        styles.onLogoBaseline,
        styles.fitsPhoneBar,
      )}
    >
      {current.name}
    </Text>
  );

  if (others.length === 0) {
    return identity;
  }

  function handleSwitch(workspaceId: string) {
    startSwitching(async () => {
      const result = await switchWorkspace(workspaceId);
      toast.error(result.message);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Workspace: ${current.name}. Switch Workspace`}
          className="group flex min-w-0 items-center gap-0.5 rounded-button py-0.5 ps-1 pe-0 text-fg-primary transition hover:bg-action-neutral-surface active:scale-97 data-[state=open]:bg-action-neutral-surface motion-reduce:transition-none sm:gap-1 sm:ps-2 sm:pe-1 sm:active:scale-100"
        >
          {identity}
          {/* On a touch screen, which has no pointing to reveal it, the chevron is always there, in
              the name's plum so the two read as one; on a phone it drops onto the name's
              lowercase, which the wordmark's baseline has moved down. */}
          <ChevronDownIcon
            aria-hidden="true"
            className="size-4 shrink-0 pointer-coarse:text-action-primary text-fg-secondary opacity-0 pointer-coarse:opacity-100 transition group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[state=open]:rotate-180 group-data-[state=open]:opacity-100 motion-reduce:transition-none max-sm:translate-y-0.75"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel>Your Workspaces</DropdownMenuLabel>
          {workspaces.active.map((workspace) => (
            <DropdownMenuCheckboxItem
              key={workspace.id}
              checked={workspace.id === current.id}
              disabled={isSwitching}
              className="data-[state=checked]:bg-action-primary-surface-hover"
              onSelect={() => {
                if (workspace.id !== current.id) {
                  handleSwitch(workspace.id);
                }
              }}
            >
              <Text
                as="span"
                variant="subtitle-display-3"
                className="min-w-0 flex-1 truncate"
              >
                {workspace.name}
              </Text>
            </DropdownMenuCheckboxItem>
          ))}
          {workspaces.inactive.map((workspace) => (
            <DropdownMenuItem key={workspace.id} disabled>
              <Text
                as="span"
                variant="subtitle-display-3"
                className="min-w-0 flex-1 truncate"
              >
                {workspace.name}
              </Text>
              <span className="text-body-3">Inactive</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCreating(true)}>
            <PlusIcon aria-hidden="true" className="size-4.5 shrink-0" />
            Create a Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent hasCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Create a Workspace</DialogTitle>
            <DialogDescription>
              You&apos;ll be its first Admin, and keep the Workspaces you are
              in.
            </DialogDescription>
          </DialogHeader>
          <CreateWorkspaceForm
            action={createAnotherWorkspace}
            submitLabel="Create and open"
            onCancel={() => setCreating(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
