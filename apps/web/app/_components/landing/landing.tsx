import { LandingFinalCta } from './landing-final-cta';
import { LandingFooter } from './landing-footer';
import { LandingForFounders } from './landing-for-founders';
import { LandingHero } from './landing-hero';
import { LandingHomePreview } from './landing-home-preview';
import { LandingHowItWorks } from './landing-how-it-works';
import { LandingNavbar } from './landing-navbar';
import { LandingPlatform } from './landing-platform';
import { LandingProblem } from './landing-problem';

/**
 * The landing page, top to bottom: the promise and a preview of Home to click through, the
 * problem it answers, how Thrive works, why it suits a founder, the platform it grows into, and
 * the way in again at the end.
 */
export function Landing() {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNavbar />
      <main className="flex flex-1 flex-col gap-gap-section px-inset-container py-12">
        <div className="flex flex-col gap-12">
          <LandingHero />
          <LandingHomePreview />
        </div>
        <LandingProblem />
        <LandingHowItWorks />
        <LandingForFounders />
        <LandingPlatform />
        <LandingFinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
