import { SettingRowSkeleton } from '@/app/(signed-in)/(sidebar)/settings/_components/setting-row';
import { readConnections } from '@/app/(signed-in)/(sidebar)/settings/workspace/_lib/connections.service';
import { mayManageIntegrations } from '@/app/(signed-in)/(sidebar)/settings/workspace/_lib/integration-access.util';
import { CHAT_PROVIDER_LIST } from '@/lib/chat/chat-providers.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { ConnectionRow } from './connection-row';

export type IntegrationListProps = {
  membership: CurrentMembership;
};

/**
 * One row per chat tool a Workspace can connect, each saying only whether it is connected; where
 * it posts and who connected it are in the row's menu.
 *
 * Every Member sees the rows, because the channel's name is not a secret and a Member seeing
 * that their Workspace posts into `#general` is the honest half of the audience risk brain
 * `ADR-0035` records. Only an Admin can connect, change or disconnect; the API refuses everyone else
 * independently (`GEN_09` R2). It reads its own data, so the section renders around it.
 */
export async function IntegrationList({ membership }: IntegrationListProps) {
  const connections = await readConnections(membership);
  const connectionOf = new Map(
    connections.map((connection) => [connection.provider, connection]),
  );
  const mayManage = mayManageIntegrations(membership);

  return (
    <>
      {CHAT_PROVIDER_LIST.map(({ segment, value, label }) => (
        <ConnectionRow
          key={segment}
          segment={segment}
          label={label}
          connection={connectionOf.get(value) ?? null}
          mayManage={mayManage}
        />
      ))}
    </>
  );
}

/** The rows while the Connections are read: each tool's name in place, the rest in grey. */
export function IntegrationListSkeleton() {
  return (
    <>
      {CHAT_PROVIDER_LIST.map(({ segment, label }) => (
        <SettingRowSkeleton key={segment} label={label} />
      ))}
    </>
  );
}
