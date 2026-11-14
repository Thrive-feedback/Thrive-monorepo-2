import { CardsEmpty } from '@/components/organisms/cards-empty';

/**
 * Waiting for me with nothing left in it, drawn as every empty list is, on the blank card of
 * everything asked. Nobody waiting is good news, so it asks nothing of the person.
 */
export function WaitingEmpty() {
  return (
    <CardsEmpty
      art="tertiary"
      title="Nothing is waiting for you."
      description="When a teammate asks you for feedback, it waits here for your answer."
    />
  );
}
