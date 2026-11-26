import Link from 'next/link';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import { HR_LANDING_COPY } from './hr-landing-copy.constant';

const { closing, demoHref } = HR_LANDING_COPY;

/**
 * The page's last word, as an envelope addressed to whoever looks after the people, holding the
 * demo once more and the quieter way in: signing in to try it alone. It is where every Book a demo
 * on the page leads until a demo has somewhere to be booked.
 */
export function HrLandingClosing() {
  const headingId = `${closing.id}-title`;
  return (
    <section
      id={closing.id}
      aria-labelledby={headingId}
      className="mx-auto flex w-full flex-col gap-8 rounded-element border border-border-muted bg-surface-paper p-inset-container text-fg-on-paper shadow-med md:flex-row md:items-center md:p-12"
    >
      <div className="flex flex-1 flex-col gap-3">
        <Text variant="body-2" className="text-fg-on-paper-secondary">
          {closing.to}{' '}
          <Text
            as="span"
            variant="subtitle-handwrite-2"
            className="text-action-secondary-hover"
          >
            {closing.address}
          </Text>
        </Text>
        <Text
          as="h2"
          id={headingId}
          variant="display-3"
          className="text-balance"
        >
          {closing.title}
        </Text>
        <Text variant="subtitle-1" className="text-fg-on-paper-secondary">
          {closing.body}
        </Text>
      </div>
      <div className="flex flex-col items-start gap-3">
        <Button asChild variant="primary" size="lg">
          <Link href={demoHref}>{closing.demo}</Link>
        </Button>
        <Link
          href={ROUTES.signIn}
          className="text-body-2 text-fg-accent underline-offset-4 hover:underline"
        >
          {closing.signIn}
        </Link>
      </div>
    </section>
  );
}
