import { Button } from '@/components/atoms/button';
import { signOut } from '@/lib/session/session-actions.service';

/**
 * Sign out, for `SiteNavbar` and the Account section of Settings. Signing out sets a cookie from a server
 * action, which makes Next render the layout again, so the button disappears without a full
 * reload.
 */
export function SignOutForm() {
  return (
    <form action={signOut}>
      <Button type="submit" size="sm">
        Sign out
      </Button>
    </form>
  );
}
