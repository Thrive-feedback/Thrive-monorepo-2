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
import { WorkspaceTile } from '@/components/molecules/workspace-tile';
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
 * it is only that. With another Workspace to open, it is a quiet button whose border and chevron
 * show on hover or focus, and its menu lists them as the switcher does (brain `ADR-0041` decision 5):
 * the current one ticked, the rest opened at once on the new Home, those the person was
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

  // Set in the display face and the primary colour, on the wordmark's baseline, so "Thrive ×
  // Acme" reads as one line: on a phone at the size the bar has room for beside the bell, Settings
  // and the avatar, and from `sm` up a little larger than the wordmark.
  const identity = (
    <Text
      as="span"
      variant="subtitle-display-2"
      className={cn(
        'max-w-36 truncate text-action-primary sm:max-w-80 sm:text-display-4',
        styles.onLogoBaseline,
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
      const result = await switchWorkspace(workspaceId, 'brandNewHome');
      toast.error(result.message);
    });
  }

  return (
    <>
      <DropdownMenu>
        {/* The border and the chevron wait a moment before they show, so a pointer passing over
            on its way elsewhere does not flash them, and go at once; the chevron keeps its room
            meanwhile, so the name never moves. */}
        <DropdownMenuTrigger
          aria-label={`Workspace: ${current.name}. Switch Workspace`}
          className="group flex min-w-0 items-center gap-2 rounded-button border border-transparent py-0.5 ps-2 pe-1.5 text-fg-primary transition-colors hover:border-border-default hover:delay-150 focus-visible:border-border-default data-[state=open]:border-border-default data-[state=open]:bg-action-neutral-surface motion-reduce:transition-none"
        >
          {identity}
          <ChevronDownIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-fg-secondary opacity-0 transition-opacity group-hover:opacity-100 group-hover:delay-150 group-focus-visible:opacity-100 group-data-[state=open]:opacity-100 motion-reduce:transition-none"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel>Your Workspaces</DropdownMenuLabel>
          {workspaces.active.map((workspace) => (
            <DropdownMenuCheckboxItem
              key={workspace.id}
              checked={workspace.id === current.id}
              disabled={isSwitching}
              onSelect={() => {
                if (workspace.id !== current.id) {
                  handleSwitch(workspace.id);
                }
              }}
            >
              <WorkspaceTile
                name={workspace.name}
                tone={workspace.id === current.id ? 'current' : 'choice'}
                size="sm"
              />
              <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
            </DropdownMenuCheckboxItem>
          ))}
          {workspaces.inactive.map((workspace) => (
            <DropdownMenuItem key={workspace.id} disabled>
              <WorkspaceTile name={workspace.name} tone="inactive" size="sm" />
              <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
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
        <DialogContent>
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
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
