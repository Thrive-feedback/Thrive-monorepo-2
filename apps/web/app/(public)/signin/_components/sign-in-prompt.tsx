import Image from 'next/image';
import { Button } from '@/components/atoms/button';
import { Logo } from '@/components/atoms/logo';
import { OneTimeToast } from '@/components/atoms/one-time-toast';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import { signIn } from '@/lib/session/session-actions.service';

/**
 * `m-auto` centres the prompt on both axes inside the layout's flex column. The heading is a
 * handwritten "Welcome to" over the wordmark, which names it "Welcome to Thrive". The Google button
 * matches the one on an Invitation opened signed out.
 */
export type SignInPromptProps = {
  /** Google or the API turned the last attempt back, and the visitor should know. */
  didSignInFail?: boolean;
  /** The page the visitor was going to, or `null` to land them where they belong. */
  destination?: string | null;
};

export function SignInPrompt({
  didSignInFail = false,
  destination = null,
}: SignInPromptProps) {
  return (
    <div className="m-auto flex w-full max-w-2xl flex-col items-center gap-8 text-center">
      <div className="flex flex-col items-center">
        <Text
          variant="subtitle-handwrite-1"
          as="h1"
          className="mb-4 flex flex-col items-center gap-4"
        >
          Welcome to <Logo className="h-10 w-33 md:h-12 md:w-40" />
        </Text>
        <Text variant="subtitle-display-1" as="p">
          Let's{' '}
          <Text as="span" variant="subtitle-display-1" tone="brand">
            Thrive
          </Text>{' '}
          together.
        </Text>
      </div>
      <form
        action={signIn.bind(null, destination)}
        className="w-full max-w-110"
      >
        {/* Google's own mark, unmodified, as their brand guidelines require. */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          prefixIcon={
            <Image
              src="/brand/google-g.svg"
              alt=""
              width={20}
              height={20}
              className="size-5"
            />
          }
        >
          Continue with Google
        </Button>
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
