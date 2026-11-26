import { LandingBand } from '@/app/_components/landing/landing-band';
import { LandingFooter } from '@/app/_components/landing/landing-footer';
import { OrbBackdrop } from '@/components/atoms/orb-backdrop';
import { HrLandingClosing } from './hr-landing-closing';
import { HrLandingCompare } from './hr-landing-compare';
import { HrLandingFaq } from './hr-landing-faq';
import { HrLandingFounder } from './hr-landing-founder';
import { HrLandingHero } from './hr-landing-hero';
import { HrLandingInsights } from './hr-landing-insights';
import { HrLandingNavbar } from './hr-landing-navbar';
import { HrLandingProblem } from './hr-landing-problem';
import { HrLandingPromise } from './hr-landing-promise';
import { HrLandingRoles } from './hr-landing-roles';

/**
 * The front page for HR (brain `ADR-0061`, the design *The post room*): the promise beside a pile
 * of post, the Google Form HR runs today, what HR does and what the team does, the privacy promise,
 * Insights to come, Thrive beside the old way, who builds it, the questions HR asks first, and an
 * envelope with the demo. It stands on the page for teams' bands and footer, so the two read as
 * one company. Drawn on the server throughout: nothing on it moves but the native disclosures.
 */
export function HrLanding() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col bg-surface-base">
      <OrbBackdrop spread="page" />
      <HrLandingNavbar />
      <main className="flex flex-1 flex-col">
        <LandingBand opening>
          <HrLandingHero />
        </LandingBand>
        <LandingBand tint="ask">
          <HrLandingProblem />
        </LandingBand>
        <LandingBand>
          <HrLandingRoles />
        </LandingBand>
        <HrLandingPromise />
        <LandingBand>
          <HrLandingInsights />
        </LandingBand>
        <LandingBand tint="thanks">
          <HrLandingCompare />
        </LandingBand>
        <LandingBand>
          <HrLandingFounder />
        </LandingBand>
        <LandingBand tint="ask">
          <HrLandingFaq />
        </LandingBand>
        <LandingBand tint="give">
          <HrLandingClosing />
        </LandingBand>
      </main>
      <LandingFooter />
    </div>
  );
}
