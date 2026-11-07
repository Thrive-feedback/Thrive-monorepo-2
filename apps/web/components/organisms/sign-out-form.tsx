import { Button, type ButtonProps } from '@/components/atoms/button';
import { signOut } from '@/lib/session/session-actions.service';

export type SignOutFormProps = {
  /**
   * How the button is drawn: quiet in `SiteNavbar`, where it sits among other links, and `warning`
   * in the Account section of Settings, where it is the step that ends the person's session.
   */
  variant?: ButtonProps['variant'];
};

/**
 * Sign out, for `SiteNavbar` and the Account section of Settings. Signing out sets a cookie from a server
 * action, which makes Next render the layout again, so the button disappears without a full
 * reload.
 */
export function SignOutForm({ variant }: SignOutFormProps) {
  return (
    <form action={signOut}>
      <Button type="submit" size="sm" variant={variant}>
        Sign out
      </Button>
    </form>
  );
}
