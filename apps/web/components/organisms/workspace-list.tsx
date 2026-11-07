import { ArrowRightIcon } from 'lucide-react';
import { Text } from '@/components/atoms/text';
import { HandwrittenNote } from '@/components/molecules/handwritten-note';
import type { MyWorkspaces } from '@/lib/workspace/my-workspace.type';

export type WorkspaceListProps = {
  workspaces: MyWorkspaces;
  /** Marked as where the person is and not offered, where they are in one already. */
  currentWorkspaceId?: string;
  /** Set while a choice is on its way, so one click cannot become two. */
  disabled?: boolean;
  onChoose: (workspaceId: string) => void;
};

/**
 * The person's Workspaces by name, the one used last first, each name set in the display face as
 * the navbar sets it, so a Workspace reads the same wherever it is named. The current one sits on
 * the product's light purple with "you're here" written beside it by hand; each other they can
 * open is a row whose "Open" and arrow appear on hover or focus, and always on a touch screen,
 * which has no hover; those they were Deactivated in are greyed, labelled Inactive, and offered
 * no way in. Nothing says what Role they have anywhere (brain `ADR-0035`).
 */
export function WorkspaceList({
  workspaces,
  currentWorkspaceId,
  disabled = false,
  onChoose,
}: WorkspaceListProps) {
  return (
    <ul aria-label="Your Workspaces" className="flex flex-col gap-1">
      {workspaces.active.map((workspace) =>
        workspace.id === currentWorkspaceId ? (
          <li
            key={workspace.id}
            aria-current="true"
            className="flex items-center gap-3 rounded-element bg-action-primary-surface-hover px-4 py-3"
          >
            <Text
              as="span"
              variant="subtitle-display-2"
              className="min-w-0 flex-1 break-words text-action-primary"
            >
              {workspace.name}
            </Text>
            <span className="sr-only">Current</span>
            <HandwrittenNote size="md" tilt="left" writes={null}>
              you&apos;re here
            </HandwrittenNote>
          </li>
        ) : (
          <li key={workspace.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChoose(workspace.id)}
              className="group flex w-full items-center gap-3 rounded-element px-4 py-3 text-start text-fg-primary transition-colors hover:bg-action-neutral-surface focus-visible:bg-action-neutral-surface disabled:pointer-events-none disabled:opacity-60 motion-reduce:transition-none"
            >
              <Text
                as="span"
                variant="subtitle-display-2"
                className="min-w-0 flex-1 break-words"
              >
                {workspace.name}
              </Text>
              <span
                aria-hidden="true"
                className="flex shrink-0 items-center gap-1 text-action-primary text-body-2 opacity-0 pointer-coarse:opacity-100 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
              >
                Open
                <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5 motion-reduce:transition-none" />
              </span>
            </button>
          </li>
        ),
      )}
      {workspaces.inactive.map((workspace) => (
        <li key={workspace.id} className="flex items-center gap-3 px-4 py-3">
          <Text
            as="span"
            variant="subtitle-display-2"
            tone="muted"
            className="min-w-0 flex-1 break-words"
          >
            {workspace.name}
          </Text>
          <Text as="span" variant="body-3" tone="muted" className="shrink-0">
            Inactive
          </Text>
        </li>
      ))}
    </ul>
  );
}
