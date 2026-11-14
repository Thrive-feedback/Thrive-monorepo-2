import 'server-only';
import { ApiError, unwrap } from '@repo/api';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import type { FeatureFlags } from './feature-flags.type';

/** What every flag reads as when the API cannot say: off, so nothing unfinished shows. */
const ALL_OFF: FeatureFlags = { showsDashboard: false };

/**
 * What this deployment has switched on (ADR 0087). Not cached across requests, so a flag changed on
 * the API holds for `/dashboard` on its next request, and for the menu on the next full page load,
 * since the layout holding the menu is not rendered again on client navigation. `cache` only shares
 * one read between the parts of one page that need it. A read that fails is every flag off rather
 * than a page that fails.
 */
export const readFeatureFlags = cache(async (): Promise<FeatureFlags> => {
  try {
    const flags = unwrap(
      await apiClient().GET('/v1/feature-flags', { cache: 'no-store' }),
    );
    return { showsDashboard: flags.USER_DASHBOARD_FLAG === 'true' };
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return ALL_OFF;
  }
});
