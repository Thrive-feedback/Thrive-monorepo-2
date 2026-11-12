import { LandingBoardCards } from './landing-board-cards';
import { LANDING_COPY } from './landing-copy.constant';
import { LandingSection } from './landing-section';

const { board } = LANDING_COPY;

/**
 * The made-up team's Kudos board: every thank-you on the card it was written on, pinned where the
 * whole team reads it. A Kudos the visitor writes on the desk lands here first.
 */
export function LandingBoard() {
  return (
    <LandingSection
      id={board.id}
      title={board.title}
      note={board.note}
      lead={board.lead}
    >
      <LandingBoardCards />
    </LandingSection>
  );
}
