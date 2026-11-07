import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CardNotesToneContext } from './card-notes';
import { CardToolNote } from './card-tool-note';

describe('CardToolNote', () => {
  it.each([
    ['primary', 'text-action-primary-hover'],
    ['tertiary', 'text-action-tertiary-hover'],
    ['secondary', 'text-action-secondary-hover'],
  ] as const)(
    'is written in the colour of the kind of card it is beside: %s',
    (tone, ink) => {
      render(
        <CardNotesToneContext value={tone}>
          <CardToolNote>Pick a stamp</CardToolNote>
        </CardNotesToneContext>,
      );

      expect(screen.getByText('Pick a stamp').parentElement).toHaveClass(ink);
    },
  );

  it('is written in the Kudos colour where nothing says otherwise', () => {
    render(<CardToolNote>Pick a stamp</CardToolNote>);

    expect(screen.getByText('Pick a stamp').parentElement).toHaveClass(
      'text-action-secondary-hover',
    );
  });
});
