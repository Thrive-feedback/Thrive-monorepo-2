import { Card } from '@/components/atoms/card';
import { GoogleSignInButton } from './google-sign-in-button';

/** `m-auto` centres the card on both axes inside the layout's flex column. */
export function LoginCard() {
  return (
    <Card title="Welcome to Thrive" className="m-auto max-w-110">
      {/* TODO(kritpavin, #9): sign in on click once an auth provider is chosen. Until then the
          button renders and does nothing. */}
      <GoogleSignInButton />
    </Card>
  );
}
