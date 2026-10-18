import type { ConnectionView } from '../../application/types/connection.types';
import { IntegrationProvider } from '../../domain/value-object/integration-provider.vo';

/**
 * The only place that knows both a stored `integration_connection` row and a Connection. The
 * provider is stored as the value object's own name, so it is parsed rather than cast: a row
 * naming a tool this release no longer connects to is a fault, not something to pass on.
 */
export function toConnectionView(record: {
  readonly provider: string;
  readonly externalWorkspaceName: string;
  readonly externalChannelName: string;
  readonly connectedByAccountId: string;
  readonly connectedAt: Date;
}): ConnectionView {
  return {
    provider: IntegrationProvider.of(record.provider).toString(),
    externalWorkspaceName: record.externalWorkspaceName,
    externalChannelName: record.externalChannelName,
    connectedByAccountId: record.connectedByAccountId,
    connectedAt: record.connectedAt,
  };
}
