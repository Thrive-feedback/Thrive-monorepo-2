import { OrbBackdrop } from '@/components/atoms/orb-backdrop';
import { LandingFinalCta } from './landing-final-cta';
import { LandingFooter } from './landing-footer';
import { LandingForLeads } from './landing-for-leads';
import { LandingHero } from './landing-hero';
import { LandingMoments } from './landing-moments';
import { LandingNavbar } from './landing-navbar';
import { LandingToday } from './landing-today';
import { LandingTour } from './landing-tour';
import { LandingWhy } from './landing-why';

/**
 * The landing page, top to bottom, as `ADR-0038` orders it: the promise, a tour of Home to click
 * through, four moments that shouldn't wait, why it works, what a team can do, who it is for, and
 * the way in again. Why it works sits on a full-width band in the light secondary tint, and the
 * way in on one in the light primary tint; behind it all, soft circles drift at three depths as the
 * page scrolls.
 */
export function Landing() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col bg-surface-base">
      <OrbBackdrop spread="page" />
      <LandingNavbar />
      <main className="flex flex-1 flex-col gap-gap-section px-inset-container pt-12 pb-16 md:gap-32 md:pb-24">
        <div className="flex flex-col gap-16 md:gap-24">
          <LandingHero />
          <LandingTour />
        </div>
        <LandingMoments />
        <div className="-mx-inset-container bg-action-secondary-surface-hover px-inset-container py-16 md:py-24">
          <LandingWhy />
        </div>
        <LandingToday />
        <LandingForLeads />
        <div className="-mx-inset-container -mb-16 bg-action-primary-surface-hover px-inset-container py-8 md:-mb-24">
          <LandingFinalCta />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
