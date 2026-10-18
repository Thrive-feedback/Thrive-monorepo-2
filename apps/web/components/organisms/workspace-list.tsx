import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
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
 * The person's Workspaces by name, the one used last first: each they can open is a choice, the
 * current one is marked instead, and those they were Deactivated in are greyed out, labelled
 * Inactive, and offered no way in. Nothing says what Role they have anywhere (brain `ADR-0035`).
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
              disabled={disabled}
              onClick={() => onChoose(workspace.id)}
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
  );
}
