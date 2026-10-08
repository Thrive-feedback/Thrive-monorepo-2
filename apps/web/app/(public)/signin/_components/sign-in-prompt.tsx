import { OneTimeToast } from '@/components/atoms/one-time-toast';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import { signIn } from '@/lib/session/session-actions.service';
import { GoogleSignInButton } from './google-sign-in-button';

/**
 * `m-auto` centres the prompt on both axes inside the layout's flex column. The heading and
 * its line share Introduce yourself's type, so the two steps of sign-in read as one flow; the
 * heading steps down a display size on narrow screens.
 */
export type SignInPromptProps = {
  /** Google or the API turned the last attempt back, and the visitor should know. */
  didSignInFail?: boolean;
};

export function SignInPrompt({ didSignInFail = false }: SignInPromptProps) {
  return (
    <div className="m-auto flex w-full max-w-2xl flex-col items-center gap-8 text-center">
      <div className="flex flex-col gap-3">
        <Text variant="display-5" as="h1" className="md:text-display-3">
          Are you ready to Thrive?
        </Text>
        <Text variant="body-2" tone="muted">
          sign in or sign up
        </Text>
      </div>
      <form action={signIn} className="w-full max-w-110">
        <GoogleSignInButton type="submit" />
      </form>
      {didSignInFail && (
        <OneTimeToast
          type="error"
          message="Sign-in didn't finish. Try again."
          then={ROUTES.signIn}
        />
      )}
    </div>
  );
}
