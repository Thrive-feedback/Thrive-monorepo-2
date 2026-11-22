import { PageTitle } from '@/app/(signed-in)/(sidebar)/_components/page-title';
import { PAGE_COLUMN_WIDTH } from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import type { Profile } from '@/app/(signed-in)/(sidebar)/profile/[slug]/_lib/profile.type';
import { Badge } from '@/components/atoms/badge';
import { Text } from '@/components/atoms/text';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { cn } from '@/lib/cn.util';
import styles from './profile-header.module.css';

/**
 * The space above what the band holds: the navbar's height, since the band starts under it, and a
 * clear gap more, so the person does not sit against the bar.
 */
export const BAND_TOP_SPACE = 'pt-24';

export type ProfileHeaderProps = {
  profile: Profile;
  /** The Profile is the reader's own, so it says You. */
  isYou?: boolean;
  /** What the reader can do from here, at the end of the header. */
  children?: React.ReactNode;
};

/**
 * The head of a Profile, a band that hangs from the navbar in the frame's tint, lit by soft glows of
 * plum, blue and orange that run on into the navbar, its foot cut in a zigzag where the page
 * begins. Inside it,
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
    // Marked so the navbar paints the band's ground rather than glass, and the two read as one.
    <header data-hangs-from-navbar="" className={styles.band}>
      <div
        className={cn(
          PAGE_COLUMN_WIDTH,
          BAND_TOP_SPACE,
          'flex flex-col gap-5 pb-8 md:flex-row md:items-center md:justify-between md:gap-6',
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
