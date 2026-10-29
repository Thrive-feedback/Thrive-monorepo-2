import { cva, type VariantProps } from 'class-variance-authority';
import { CheckIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { WorkspaceTile } from '@/components/molecules/workspace-tile';
import type { MyWorkspaces } from '@/lib/workspace/my-workspace.type';

export type WorkspaceListProps = {
  workspaces: MyWorkspaces;
  /** Marked Current and not offered, where the person is in one already. */
  currentWorkspaceId?: string;
  /** Set while a choice is on its way, so one click cannot become two. */
  disabled?: boolean;
  onChoose: (workspaceId: string) => void;
};

/**
 * The person's Workspaces by name, the one used last first, each beside a tile of its initials:
 * each they can open is a choice that lifts on hover, the current one is highlighted and marked
 * instead, and those they were Deactivated in are greyed out, labelled Inactive, and offered no
 * way in. Nothing says what Role they have anywhere (brain `ADR-0035`).
 */
export function WorkspaceList({
  workspaces,
  currentWorkspaceId,
  disabled = false,
  onChoose,
}: WorkspaceListProps) {
  return (
    <ul aria-label="Your Workspaces" className="flex flex-col gap-2">
      {workspaces.active.map((workspace) =>
        workspace.id === currentWorkspaceId ? (
          <li
            key={workspace.id}
            aria-current="true"
            className="flex items-center gap-3 rounded-element border border-action-primary-border bg-action-primary-surface px-3 py-2.5"
          >
            <WorkspaceTile name={workspace.name} tone="current" />
            <Text variant="subtitle-4" className="min-w-0 flex-1 break-all">
              {workspace.name}
            </Text>
            <Pill tone="current">
              <CheckIcon aria-hidden="true" className="size-3.5" />
              Current
            </Pill>
          </li>
        ) : (
          <li key={workspace.id}>
            <Button
              variant="secondary"
              disabled={disabled}
              onClick={() => onChoose(workspace.id)}
              className="group h-auto w-full justify-start gap-3 px-3 py-2.5 text-start"
            >
              <WorkspaceTile name={workspace.name} tone="choice" />
              <span className="min-w-0 flex-1 break-all text-subtitle-4">
                {workspace.name}
              </span>
              <ChevronRightIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-fg-secondary transition-transform group-hover:translate-x-0.5 group-hover:text-action-primary"
              />
            </Button>
          </li>
        ),
      )}
      {workspaces.inactive.map((workspace) => (
        <li
          key={workspace.id}
          className="flex items-center gap-3 rounded-element border border-border-subtle border-dashed px-3 py-2.5"
        >
          <WorkspaceTile name={workspace.name} tone="inactive" />
          <Text
            variant="subtitle-4"
            tone="muted"
            className="min-w-0 flex-1 break-all"
          >
            {workspace.name}
          </Text>
          <Pill tone="inactive">Inactive</Pill>
        </li>
      ))}
    </ul>
  );
}

const pill = cva(
  'flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-body-3',
  {
    variants: {
      tone: {
        current: 'bg-action-primary text-fg-on-action',
        inactive: 'bg-surface-subtle text-fg-secondary',
      },
    },
  },
);

function Pill({
  tone,
  children,
}: Required<VariantProps<typeof pill>> & { children: React.ReactNode }) {
  return <span className={pill({ tone })}>{children}</span>;
}
