import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PersonChip } from './person-chip';

const BEN = {
  name: 'Ben Carter',
  photoUrl: null,
  inactive: false,
  isYou: false,
};

describe('PersonChip', () => {
  it('shows the face beside the name, the face hidden from a screen reader', () => {
    render(<PersonChip person={BEN} unnamed="a teammate" />);

    expect(screen.getByText('Ben Carter')).toBeInTheDocument();
    expect(
      screen.getByText('BC').closest('[aria-hidden="true"]'),
    ).not.toBeNull();
  });

  it('names the person reading "you", and "You" when they open a sentence', () => {
    const { rerender } = render(
      <PersonChip person={{ ...BEN, isYou: true }} unnamed="a teammate" />,
    );
    expect(screen.getByText('you')).toBeInTheDocument();
    expect(screen.queryByText('Ben Carter')).toBeNull();

    rerender(
      <PersonChip
        person={{ ...BEN, isYou: true }}
        unnamed="a teammate"
        sentenceStart
      />,
    );
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('calls somebody with no name yet by the screen’s word for them', () => {
    render(
      <PersonChip
        person={{ ...BEN, name: null }}
        unnamed="a teammate"
        faceName="ben@acme.test"
      />,
    );

    expect(screen.getByText('a teammate')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('shows somebody Deactivated in grey with "(inactive)"', () => {
    render(
      <PersonChip person={{ ...BEN, inactive: true }} unnamed="a teammate" />,
    );

    expect(screen.getByText('Ben Carter (inactive)')).toHaveClass(
      'text-fg-secondary',
    );
  });
});
