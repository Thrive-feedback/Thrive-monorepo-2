import { notFound } from 'next/navigation';
import { readFeatureFlags } from '@/lib/feature-flags/feature-flags.service';
import { requireMember } from '@/lib/session/session.service';

/**
 * Decides whether the dashboard exists before anything of it is sent (ADR 0087). It sits outside
 * the boundary `loading.tsx` draws, so a deployment that has switched the page off answers a real
 * 404 instead of a 200 that streams the page's skeleton first. It is the dashboard's own layout,
 * so it renders on every visit to it. Signed out still goes to sign in first, as it did before.
 */
export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [, { showsDashboard }] = await Promise.all([
    requireMember(),
    readFeatureFlags(),
  ]);
  if (!showsDashboard) {
    notFound();
  }
  return children;
}
