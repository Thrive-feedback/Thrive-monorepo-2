import type { Metadata } from 'next';
import { NotificationGallery } from './_components/notification-gallery';

export const metadata: Metadata = {
  title: 'Notifications',
  description:
    'Every notification Thrive sends, with what raises it and where it leads.',
  robots: { index: false, follow: false },
};

export default function NotificationsPage() {
  return <NotificationGallery />;
}
