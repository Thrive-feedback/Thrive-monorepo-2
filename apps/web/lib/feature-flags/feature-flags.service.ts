import 'server-only';
import { ApiError, unwrap } from '@repo/api';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import type { FeatureFlags } from './feature-flags.type';

/** What every flag reads as when the API cannot say: off, so nothing unfinished shows. */
const ALL_OFF: FeatureFlags = { showsDashboard: false, showsHrLanding: false };

/**
 * How long a flag read may take before it counts as failed. The public front page waits on it for
 * every visitor, so an API that accepts the connection and then stalls must not hold the page for
 * fetch's own limits, which run to minutes.
 */
export const FLAG_READ_TIMEOUT_MS = 1500;

/**
 * What this deployment has switched on (ADR 0087), or `null` when the API cannot say, including
 * when it does not answer within `FLAG_READ_TIMEOUT_MS`. For a page whose job is to report the
 * flags, where "could not read them" must not look the same as "all off". Not cached across
 * requests; `cache` only shares one read between the parts of one page.
 */
export const readDeploymentFlags = cache(
  async (): Promise<FeatureFlags | null> => {
    try {
      const flags = unwrap(
        await apiClient().GET('/v1/feature-flags', {
          cache: 'no-store',
          signal: AbortSignal.timeout(FLAG_READ_TIMEOUT_MS),
        }),
      );
      return {
        showsDashboard: flags.USER_DASHBOARD_FLAG === 'true',
        showsHrLanding: flags.HR_LANDING_FLAG === 'true',
      };
    } catch (error) {
      if (error instanceof ApiError || isAbandoned(error)) {
        return null;
      }
      throw error;
    }
  },
);

/**
 * Whether the read was given up on. Before the answer's headers, the client turns that into an
 * `ApiError`; once they have arrived, reading the body rejects with the abort itself, outside the
 * client's handling, and it must count as a failed read all the same.
 */
function isAbandoned(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'TimeoutError' || error.name === 'AbortError')
  );
}

/**
 * What this deployment has switched on, for a page deciding what to show. A flag changed on the
 * API holds for `/dashboard` on its next request, and for the menu on the next full page load,
 * since the layout holding the menu is not rendered again on client navigation. A read that fails
 * is every flag off rather than a page that fails.
 */
export const readFeatureFlags = cache(
  async (): Promise<FeatureFlags> => (await readDeploymentFlags()) ?? ALL_OFF,
);
