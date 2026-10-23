import { CONNECTABLE_PROVIDERS } from '@/app/(signed-in)/(member)/settings/workspace/_lib/chat-providers.constant';
import { readConnections } from '@/app/(signed-in)/(member)/settings/workspace/_lib/connections.service';
import { mayManageIntegrations } from '@/app/(signed-in)/(member)/settings/workspace/_lib/integration-access.util';
import { calendarDay } from '@/lib/calendar-day.util';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { SettingRow } from '../../_components/setting-row';
import { ConnectIntegrationButton } from './connect-integration-button';
import { DisconnectIntegrationButton } from './disconnect-integration-button';

export type IntegrationListProps = {
  membership: CurrentMembership;
};

const NOT_CONNECTED =
  'Not connected. Feedback shown to the whole Workspace can be announced in one channel.';

/**
 * Said to every Member, not only to the Admin who could act on it: disconnecting stops their own
 * direct messages too, and somebody who linked their account has no other way to learn that.
 */
const DISCONNECTING_STOPS_MESSAGES =
  'Disconnecting stops this channel hearing about Feedback, and stops Thrive messaging anyone who linked their own account.';

/**
 * One row per chat tool a Workspace can connect: either the channel it posts in, the server it
 * is in, and who connected it, or that it is not connected.
 *
 * Every Member sees the rows, because the channel's name is not a secret and a Member seeing
 * that their Workspace posts into `#general` is the honest half of the audience risk brain
 * `ADR-0035` records. Only an Admin gets the button; the API refuses everyone else
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
      {CONNECTABLE_PROVIDERS.map(({ segment, value, label }) => {
        const connection = connectionOf.get(value);
        return (
          <SettingRow
            key={segment}
            label={label}
            description={
              connection
                ? `#${connection.channelName} in ${connection.spaceName} · connected by ${connection.connectedBy} · ${calendarDay(connection.connectedAt)}. ${DISCONNECTING_STOPS_MESSAGES}`
                : NOT_CONNECTED
            }
          >
            {mayManage && (
              <span className="flex flex-wrap items-center gap-2">
                <ConnectIntegrationButton
                  segment={segment}
                  label={label}
                  isConnected={Boolean(connection)}
                />
                {connection && (
                  <DisconnectIntegrationButton
                    segment={segment}
                    label={label}
                    channelName={connection.channelName}
                  />
                )}
              </span>
            )}
          </SettingRow>
        );
      })}
    </>
  );
}

/** The rows while the Connections are read: each tool's name in place, the rest in grey. */
export function IntegrationListSkeleton() {
  return (
    <>
      {CONNECTABLE_PROVIDERS.map(({ segment, label }) => (
        <SettingRow key={segment} label={label} description="Reading…">
          {null}
        </SettingRow>
      ))}
    </>
  );
}
