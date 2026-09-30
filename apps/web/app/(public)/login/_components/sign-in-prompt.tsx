import { signIn } from '@/app/(public)/_lib/mock-session.service';
import { Text } from '@/components/atoms/text';
import { GoogleSignInButton } from './google-sign-in-button';

/**
 * `m-auto` centres the prompt on both axes inside the layout's flex column. The heading and
 * its line share Introduce yourself's type, so the two steps of sign-in read as one flow; the
 * heading steps down a display size on narrow screens.
 */
export function SignInPrompt() {
  return (
    <div className="m-auto flex w-full max-w-2xl flex-col items-center gap-8 text-center">
      <div className="flex flex-col gap-3">
        <Text variant="display5" as="h1" className="md:text-display3">
          Are you ready to Thrive?
        </Text>
        <Text variant="body2" tone="muted">
          sign in or sign up
        </Text>
      </div>
      {/* TODO(kritpavin, #70): sign in with Google once an auth provider is chosen. Until then
          the button signs in as a sample Account. */}
      <form action={signIn} className="w-full max-w-110">
        <GoogleSignInButton type="submit" />
      </form>
    </div>
  );
}
