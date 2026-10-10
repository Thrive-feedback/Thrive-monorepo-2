import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import { GoogleSignInButton } from '@/components/molecules/google-sign-in-button';

export function GoogleSignInButtonEntry() {
  return (
    <ShowcaseEntry
      name="GoogleSignInButton"
      level="molecule"
      origin="thrive"
      source="components/molecules/google-sign-in-button.tsx — Button + Google's mark"
      summary="Starts signing in with Google, the one way into Thrive."
      useFor="Every place someone signs in: the sign-in page, and an Invitation opened signed out."
      avoidFor="Anything but signing in with Google — use Button."
      usage={`import { GoogleSignInButton } from '@/components/molecules/google-sign-in-button';

<form action={signIn}>
  <GoogleSignInButton type="submit" />
</form>`}
      props={[
        {
          name: '...rest',
          type: "Omit<ButtonProps, 'children' | 'variant' | 'size' | 'asChild'>",
          description:
            'Every other Button prop, such as type, loading and onClick. The label is fixed.',
        },
      ]}
      accessibility={[
        'Named by its label, “Continue with Google”; the mark is decorative.',
        'Reached with Tab, pressed with Enter or Space.',
      ]}
    >
      <StateCell label="Default">
        <GoogleSignInButton />
      </StateCell>
      <StateCell label="Loading">
        <GoogleSignInButton loading />
      </StateCell>
    </ShowcaseEntry>
  );
}

export function GoogleSignInButtonPreview() {
  return <GoogleSignInButton />;
}
