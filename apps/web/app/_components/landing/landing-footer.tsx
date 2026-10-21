import { Text } from '@/components/atoms/text';
import { NavbarLogo } from '@/components/molecules/navbar-logo';
import { LANDING_COPY } from './landing-copy.constant';

export function LandingFooter() {
  return (
    <footer className="border-border-subtle border-t px-inset-container py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <NavbarLogo />
        <Text variant="body-2" tone="muted">
          {LANDING_COPY.footer.tagline}
        </Text>
      </div>
    </footer>
  );
}
