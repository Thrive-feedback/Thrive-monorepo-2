/** What this deployment has switched on, as the screens read it. */
export type FeatureFlags = {
  /** Whether Your dashboard is in the menu and answers at its address. */
  showsDashboard: boolean;
  /** Whether the front page is the one for HR, and the page for teams answers at `/for-teams`. */
  showsHrLanding: boolean;
};
