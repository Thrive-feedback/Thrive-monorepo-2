import { GoogleSignInButton } from './google-sign-in-button';

/** `m-auto` centres the card on both axes inside the layout's flex column. */
export function LoginCard() {
  return (
    <section className="m-auto flex w-full max-w-110 flex-col rounded-floating border border-line bg-surface-floating shadow-floating">
      <header className="border-line border-b px-6 pt-6 pb-4">
        <h1 className="text-center font-medium text-xl">Welcome to Thrive</h1>
      </header>
      <div className="p-6">
        {/* TODO(kritpavin, #9): sign in on click once an auth provider is chosen. Until then the
            button renders and does nothing. */}
        <GoogleSignInButton />
      </div>
    </section>
  );
}
