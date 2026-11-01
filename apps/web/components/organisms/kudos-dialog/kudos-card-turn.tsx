import postcardStyles from '@/components/organisms/postcard-dialog/postcard.module.css';
import type { PostcardSide } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import { useCardTurn } from '@/components/organisms/postcard-dialog/use-card-turn';
import { cn } from '@/lib/cn.util';

const FACE = 'col-start-1 row-start-1';

export type KudosCardTurnProps = {
  /** The side to show. A change turns the card over to it. */
  side: PostcardSide;
  front: React.ReactNode;
  back: React.ReactNode;
};

/**
 * The two sides of a Kudos card in one place, turning as a postcard does. Both stay drawn, so nothing
 * on the front is lost while the back shows; the side not showing is hidden and inert, so only the
 * side showing can be reached.
 */
export function KudosCardTurn({ side, front, back }: KudosCardTurnProps) {
  const { shownSide, turnClassName, handleAnimationEnd } = useCardTurn(side);

  return (
    <div className={postcardStyles.stage}>
      <div
        className={cn('grid', turnClassName)}
        onAnimationEnd={handleAnimationEnd}
      >
        <div
          aria-hidden={shownSide !== 'front'}
          inert={shownSide !== 'front'}
          className={cn(FACE, shownSide !== 'front' && 'invisible')}
        >
          {front}
        </div>
        <div
          aria-hidden={shownSide !== 'back'}
          inert={shownSide !== 'back'}
          className={cn(FACE, shownSide !== 'back' && 'invisible')}
        >
          {back}
        </div>
      </div>
    </div>
  );
}
