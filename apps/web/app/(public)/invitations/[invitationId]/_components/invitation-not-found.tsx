import { Link } from '@/components/atoms/link';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';

/**
 * An Invitation link that leads nowhere: cut short when it was copied, mistyped, or never one of
 * Thrive's. It is drawn as an Invitation that has closed is, on the same ground, so the person still
 * knows where they are, and it names the one way in, which is the link in their email or a new one.
 */
export function InvitationNotFound() {
  return (
    <div className="m-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <Text
          variant="subtitle-handwrite-1"
          as="p"
          className="-rotate-3 text-action-secondary-hover"
        >
          Hmm, that link…
        </Text>
        <Text variant="display-5" as="h1" className="md:text-display-4">
          We can't find this invitation.
        </Text>
      </div>
      <Text variant="body-2" tone="muted" className="max-w-md text-balance">
        The link may have been cut short or mistyped. Open it again from the
        email, or ask whoever invited you to send a new one.
      </Text>
      <Link href={ROUTES.signIn}>Sign in to Thrive</Link>
    </div>
  );
}
