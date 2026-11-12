import { OrbBackdrop } from '@/components/atoms/orb-backdrop';
import { LandingBand } from './landing-band';
import { LandingBoard } from './landing-board';
import { LandingFinalCta } from './landing-final-cta';
import { LandingFooter } from './landing-footer';
import { LandingHero } from './landing-hero';
import { LandingMoments } from './landing-moments';
import { LandingNavbar } from './landing-navbar';
import { LandingPost } from './landing-post';
import { LandingToday } from './landing-today';
import { LandingWhy } from './landing-why';

/**
 * The landing page, told as post between teammates (`ADR-0054`): the promise over a spread of
 * cards to write, two moments on the postcards they would be written on, the team's Kudos board, why
 * it works on cards as the app's lists draw them, what a team can do on cards of its own, and a letter to whoever
 * leads the team with the way in. What the visitor writes on the desk is shared with the board
 * through `LandingPost`; the sections between are drawn on the server. Sections alternate between
 * the plain page and a band in a hue's light tint with perforated edges, so each one's end is
 * plain to see; behind it all, soft circles drift at three depths as the page scrolls.
 */
export function Landing() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col bg-surface-base">
      <OrbBackdrop spread="page" />
      <LandingNavbar />
      <main className="flex flex-1 flex-col">
        <LandingPost>
          <LandingBand opening>
            <LandingHero />
          </LandingBand>
          <LandingBand tint="ask">
            <LandingMoments />
          </LandingBand>
          <LandingBand>
            <LandingBoard />
          </LandingBand>
        </LandingPost>
        <LandingBand tint="thanks">
          <LandingWhy />
        </LandingBand>
        <LandingBand>
          <LandingToday />
        </LandingBand>
        <LandingBand tint="give">
          <LandingFinalCta />
        </LandingBand>
      </main>
      <LandingFooter />
    </div>
  );
}
