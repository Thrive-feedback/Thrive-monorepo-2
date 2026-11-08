import type { Metadata } from 'next';
import { SettingsGallery } from './_components/settings-gallery';

export const metadata: Metadata = {
  title: 'Settings rows',
  description:
    'The Settings rows that depend on links, Connections and Invitations, in every state.',
  robots: { index: false, follow: false },
};

export default function SettingsShowcasePage() {
  return <SettingsGallery />;
}
