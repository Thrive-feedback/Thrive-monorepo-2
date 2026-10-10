import { Text } from '@/components/atoms/text';

/**
 * Where an Invitation's Accept link lands until accepting is built. The link in the email is
 * already the one accepting will use, so an email sent today keeps working; this page only says
 * so. It reads nothing about the Invitation, so it shows nothing anyone could probe for.
 */
export function InvitationComingSoon() {
  return (
    <div className="m-auto flex w-full max-w-2xl flex-col items-center gap-3 text-center">
      <Text variant="display-5" as="h1" className="md:text-display-3">
        You&apos;ve been invited to Thrive
      </Text>
      <Text variant="body-2" tone="muted">
        Joining opens soon. Keep this email — its link will let you join once it
        does.
      </Text>
    </div>
  );
}
