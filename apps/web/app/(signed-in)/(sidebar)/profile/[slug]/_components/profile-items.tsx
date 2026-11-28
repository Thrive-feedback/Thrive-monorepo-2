import { PersonalItemsRetry } from '@/app/(signed-in)/(sidebar)/_components/personal-items-retry';
import { readFirstPage } from '@/app/(signed-in)/(sidebar)/_lib/read-first-page.service';
import type { Profile } from '@/app/(signed-in)/(sidebar)/profile/[slug]/_lib/profile.type';
import { readProfileItems } from '@/app/(signed-in)/(sidebar)/profile/[slug]/_lib/profile-items.service';
import { CardsEmpty } from '@/components/organisms/cards-empty';
import type { ProfileShow } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { ProfileItemList } from './profile-item-list';

export type ProfileItemsProps = {
  membership: CurrentMembership;
  profile: Profile;
  show: ProfileShow;
  /** The Profile is the reader's own. */
  isYou?: boolean;
};

/** What an empty list says, to the person whose Profile it is and to anyone else. */
function emptyOf(show: ProfileShow, name: string, isYou: boolean) {
  if (show === 'shared') {
    return {
      art: 'tertiary',
      title: `Nothing written to ${name} has been shared with you.`,
      description: `Feedback for ${name} that somebody chose to show you will appear here. Each teammate sees only what was shared with them.`,
    } as const;
  }
  if (show === 'between') {
    return {
      art: 'primary',
      title: `Nothing between you and ${name} yet.`,
      description: `Feedback and kudos you and ${name} gave each other, or that someone gave you both, will show here.`,
    } as const;
  }
  if (show === 'asks') {
    return {
      art: 'tertiary',
      title: `No open asks between you and ${name}.`,
      description: `When you ask ${name} for feedback, or ${name} asks you, it waits here until it is answered.`,
    } as const;
  }
  if (show === 'kudos') {
    return {
      art: 'secondary',
      title: isYou ? 'No kudos for you yet.' : `No kudos for ${name} yet.`,
      description: isYou
        ? 'Kudos that @mention you will show here.'
        : `Kudos that @mention ${name} will show here.`,
    } as const;
  }
  return {
    art: 'primary',
    title: isYou
      ? 'No feedback everyone can read yet.'
      : `No feedback for ${name} that everyone can read yet.`,
    description: isYou
      ? 'Feedback written to you and shared with everyone in the Workspace will show here. The rest is in Received, for you.'
      : `Feedback written to ${name} and shared with everyone in the Workspace will show here.`,
  } as const;
}

/** The first page of the open list, read here so the Profile renders around it while it is in flight. */
export async function ProfileItems({
  membership,
  profile,
  show,
  isYou = false,
}: ProfileItemsProps) {
  const page = await readFirstPage(() =>
    readProfileItems(membership, profile.accountId, show),
  );

  if (!page) {
    return <PersonalItemsRetry />;
  }
  if (page.items.length === 0) {
    return <CardsEmpty {...emptyOf(show, profile.name, isYou)} />;
  }
  return (
    <ProfileItemList
      // The list keeps what it read, so a new card at the top starts it again, as on Home.
      key={page.items[0]?.id}
      initialPage={page}
      slug={profile.slug}
      accountId={profile.accountId}
      show={show}
    />
  );
}
