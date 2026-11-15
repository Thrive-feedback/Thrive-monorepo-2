import { PageTitle } from '@/app/(signed-in)/(sidebar)/_components/page-title';
import { PAGE_COLUMN_WIDTH } from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import type { Profile } from '@/app/(signed-in)/(sidebar)/profile/[slug]/_lib/profile.type';
import { Badge } from '@/components/atoms/badge';
import { Text } from '@/components/atoms/text';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { cn } from '@/lib/cn.util';
import styles from './profile-header.module.css';

/** The band's top corners, where it meets the frame's: both on a phone, the right one beside the sidebar. */
export const BAND_CORNERS = 'rounded-t-page md:rounded-tl-none';

export type ProfileHeaderProps = {
  profile: Profile;
  /** The Profile is the reader's own, so it says You. */
  isYou?: boolean;
  /** What the reader can do from here, at the end of the header. */
  children?: React.ReactNode;
};

/**
 * The head of a Profile, a band across the top of the page with nothing between it and the navbar,
 * in a light haze of Thrive's three colours, its foot perforated like a sheet of stamps. Inside it,
 * kept to the page's column: the person's small face and the name they go by, then their full name,
 * then the address they sign in with, each on a line of its own. Someone who has
 * left is marked Deactivated, so nobody writes to them expecting an answer. What the reader can do
 * follows, under the person on a phone and at the end of the row from `md`.
 */
export function ProfileHeader({
  profile,
  isYou = false,
  children,
}: ProfileHeaderProps) {
  return (
    // The frame's rounded corners are glass laid over the page, so the band rounds itself under them
    // too, or its haze would show through the glass as a square. Beside the sidebar only the right
    // corner meets the frame.
    <header className={cn(styles.band, BAND_CORNERS)}>
      <div
        className={cn(
          PAGE_COLUMN_WIDTH,
          'flex flex-col gap-5 pt-8 pb-10 md:flex-row md:items-center md:justify-between md:gap-6',
        )}
      >
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
            <PhotoAvatar name={profile.name} photoUrl={profile.photoUrl} />
            <PageTitle>{profile.name}</PageTitle>
            {isYou && (
              <Badge size="sm" tone="outline">
                You
              </Badge>
            )}
            {profile.isDeactivated && (
              <Badge size="sm" tone="neutral">
                Deactivated
              </Badge>
            )}
          </div>
          {/* The full name says who the display name is, so it comes first under it. */}
          <Text as="p" variant="subtitle-3" className="break-words">
            {profile.fullName}
          </Text>
          <Text as="p" variant="body-2" tone="muted" className="break-words">
            {profile.email}
          </Text>
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </header>
  );
}
