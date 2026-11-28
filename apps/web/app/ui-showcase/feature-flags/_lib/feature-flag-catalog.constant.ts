import type { components } from '@repo/api';
import type { FeatureFlags } from '@/lib/feature-flags/feature-flags.type';
import { ROUTES } from '@/lib/routes.constant';

/** What the showcase says about one flag, beside the value the deployment answers for it. */
export type FeatureFlagEntry<
  Key extends keyof FeatureFlags = keyof FeatureFlags,
> = {
  /** Which of `FeatureFlags` it is, so a row can read its state. */
  key: Key;
  /**
   * The variable set on `thrive-api` that switches it, as the deployment names it, which is also
   * its key on the wire: typed from the contract, so a renamed key fails here.
   */
  variable: keyof components['schemas']['GetFeatureFlagsResponseDto_Output'];
  /** What it switches, in a few words. */
  title: string;
  whenOn: string;
  whenOff: string;
  /** The addresses whose answer changes with it. */
  pages: readonly string[];
};

/**
 * Every flag the web reads (ADR 0087), keyed as `FeatureFlags` is, so a flag added there and not
 * described here fails the type check instead of going missing from the showcase.
 */
const FEATURE_FLAG_CATALOG: {
  readonly [Key in keyof FeatureFlags]: FeatureFlagEntry<Key>;
} = {
  showsDashboard: {
    key: 'showsDashboard',
    variable: 'USER_DASHBOARD_FLAG',
    title: 'Your dashboard',
    whenOn: 'The menu links to Your dashboard, and its page answers.',
    whenOff:
      'The menu shows it greyed as Under construction, not a link, and the page answers not found.',
    pages: [ROUTES.dashboard],
  },
  showsHrLanding: {
    key: 'showsHrLanding',
    variable: 'HR_LANDING_FLAG',
    title: 'The front page for HR',
    whenOn:
      'The front page speaks to HR, the page for teams moves to its own address, and each links to the other.',
    whenOff:
      'The front page is the page for teams, with no switch, and its own address answers not found.',
    pages: [ROUTES.landing, ROUTES.forTeams],
  },
};

/** The flags in the order the showcase lists them. */
export const FEATURE_FLAG_ENTRIES: readonly FeatureFlagEntry[] =
  Object.values(FEATURE_FLAG_CATALOG);
