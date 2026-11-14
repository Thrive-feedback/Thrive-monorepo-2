import type { Metadata } from 'next';
import { requireUiShowcaseAccess } from '@/lib/ui-showcase/ui-showcase-access.service';
import { SettingsGallery } from './_components/settings-gallery';

/** Asked here too, so someone not on the list is sent nothing about this page (ADR 0088). */
export async function generateMetadata(): Promise<Metadata> {
  await requireUiShowcaseAccess();
  return {
    title: 'Settings rows',
    description:
      'The Settings rows that depend on links, Connections and Invitations, in every state.',
    robots: { index: false, follow: false },
  };
}

export default async function SettingsShowcasePage() {
  await requireUiShowcaseAccess();
  return <SettingsGallery />;
}
