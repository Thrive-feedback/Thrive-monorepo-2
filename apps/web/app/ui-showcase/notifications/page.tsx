import type { Metadata } from 'next';
import { requireUiShowcaseAccess } from '@/lib/ui-showcase/ui-showcase-access.service';
import { NotificationGallery } from './_components/notification-gallery';

/** Asked here too, so someone not on the list is sent nothing about this page (ADR 0088). */
export async function generateMetadata(): Promise<Metadata> {
  await requireUiShowcaseAccess();
  return {
    title: 'Notifications',
    description:
      'Every notification Thrive sends, with what raises it and where it leads.',
    robots: { index: false, follow: false },
  };
}

export default async function NotificationsPage() {
  await requireUiShowcaseAccess();
  return <NotificationGallery />;
}
