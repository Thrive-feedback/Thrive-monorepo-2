import { cva } from 'class-variance-authority';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes.constant';

/** Which landing page a visitor is on: the front page for HR, or the page for teams. */
export type Audience = 'hr' | 'teams';

const AUDIENCES = [
  { audience: 'hr', label: 'For HR', href: ROUTES.landing },
  { audience: 'teams', label: 'For teams', href: ROUTES.forTeams },
] as const;

const audienceLink = cva(
  'whitespace-nowrap rounded-full px-3 py-1.5 transition-colors duration-quick',
  {
    variants: {
      current: {
        true: 'bg-action-primary text-fg-on-action',
        false: 'text-fg-secondary hover:text-fg-primary',
      },
    },
  },
);

export type AudienceSwitchProps = {
  current: Audience;
};

/**
 * The two landing pages as a pair of links, the one being read marked as the current page (brain
 * `ADR-0061`). Links, not a toggle button: each side is a page with its own address, so it can be
 * opened in a new tab or shared.
 */
export function AudienceSwitch({ current }: AudienceSwitchProps) {
  return (
    <nav
      aria-label="Who this page is for"
      className="flex rounded-full border border-border-muted bg-surface-base p-0.5 text-label"
    >
      {AUDIENCES.map(({ audience, label, href }) => {
        const isCurrent = audience === current;
        return (
          <Link
            key={audience}
            href={href}
            aria-current={isCurrent ? 'page' : undefined}
            className={audienceLink({ current: isCurrent })}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
