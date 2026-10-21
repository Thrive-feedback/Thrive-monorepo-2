import { LandingBackdrop } from './landing-backdrop';
import { LandingFinalCta } from './landing-final-cta';
import { LandingFooter } from './landing-footer';
import { LandingForFounders } from './landing-for-founders';
import { LandingHero } from './landing-hero';
import { LandingNavbar } from './landing-navbar';
import { LandingProblem } from './landing-problem';
import { LandingResearch } from './landing-research';
import { LandingToday } from './landing-today';
import { LandingTour } from './landing-tour';

/**
 * The landing page, top to bottom: the promise, a tour of Home to click through, the problem it
 * answers, the research behind how Thrive works, what a team can do today, why it suits a founder,
 * and the way in again at the end. The problem sits on a full-width grey band and the way in on one
 * in the primary tint; behind it all, handwritten marks drift at three depths as the page scrolls.
 */
export function Landing() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col bg-surface-base">
      <LandingBackdrop />
      <LandingNavbar />
      <main className="flex flex-1 flex-col gap-gap-section px-inset-container pt-12 pb-16 md:gap-32 md:pb-24">
        <div className="flex flex-col gap-16 md:gap-24">
          <LandingHero />
          <LandingTour />
        </div>
        <div className="-mx-inset-container bg-surface-subtle px-inset-container py-16 md:py-24">
          <LandingProblem />
        </div>
        <LandingResearch />
        <LandingToday />
        <LandingForFounders />
        <div className="-mx-inset-container -mb-16 bg-action-primary-surface-hover px-inset-container py-8 md:-mb-24">
          <LandingFinalCta />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
