import { SettingRow } from '@/app/(signed-in)/(sidebar)/settings/_components/setting-row';
import type { WorkspaceConnection } from '@/app/(signed-in)/(sidebar)/settings/workspace/_lib/connection.type';
import { StatusText } from '@/components/atoms/status-text';
import { ConnectIntegrationButton } from './connect-integration-button';
import { ConnectionActions } from './connection-actions';

/**
 * What connecting is for, behind the ⓘ beside the tool's name, said to every Member: the channel
 * posts, and that a Member's own Linked Account only works through this Connection.
 */
function whatConnectingDoes(tool: string): string {
  return `Thrive posts Kudos, and Feedback shared with everyone in the Workspace, in one ${tool} channel an Admin picks. It also lets teammates who link their own ${tool} get direct messages.`;
}

export type ConnectionRowProps = {
  /** The chat tool, by the segment that names it in a URL. */
  segment: string;
  /** What the tool is called on screen. */
  label: string;
  /** The Workspace's Connection to it, or `null` while there is none. */
  connection: WorkspaceConnection | null;
  /** An Admin, who can connect, change and disconnect; the API refuses anyone else regardless. */
  mayManage: boolean;
};

/**
 * One chat tool a Workspace can connect, saying only where it stands. Not connected, it offers an
 * Admin the button to connect it. Connected, every Member gets a menu with where it posts, and an
 * Admin can also change or disconnect it there.
 */
export function ConnectionRow({
  segment,
  label,
  connection,
  mayManage,
}: ConnectionRowProps) {
  return (
    <SettingRow
      label={label}
      description={
        connection ? (
          <StatusText tone="success">Connected</StatusText>
        ) : (
          'Not connected'
        )
      }
      info={whatConnectingDoes(label)}
    >
      {connection ? (
        <ConnectionActions
          segment={segment}
          label={label}
          connection={connection}
          mayManage={mayManage}
        />
      ) : (
        mayManage && (
          <ConnectIntegrationButton segment={segment} label={label} />
        )
      )}
    </SettingRow>
  );
}
