import { signIn } from '@/app/(public)/_lib/mock-session.service';
import { Card } from '@/components/atoms/card';
import { GoogleSignInButton } from './google-sign-in-button';

/** `m-auto` centres the card on both axes inside the layout's flex column. */
export function LoginCard() {
  return (
    <Card title="Welcome to Thrive" className="m-auto max-w-110">
      {/* TODO(kritpavin, #70): sign in with Google once an auth provider is chosen. Until then
          the button signs in as a sample Account. */}
      <form action={signIn}>
        <GoogleSignInButton type="submit" />
      </form>
    </Card>
  );
}
