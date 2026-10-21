import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ComponentSearch } from './component-search';

const LEVELS = [
  {
    level: 'atom',
    title: 'Atoms',
    folder: 'components/atoms/',
    description: 'The smallest parts.',
  },
  {
    level: 'molecule',
    title: 'Molecules',
    folder: 'components/molecules/',
    description: 'Atoms arranged for one job.',
  },
] as const;

const CARDS = [
  { slug: 'button', name: 'Button', level: 'atom', preview: null },
  { slug: 'badge', name: 'Badge', level: 'atom', preview: null },
  { slug: 'text-field', name: 'TextField', level: 'molecule', preview: null },
] as const;

function search() {
  return screen.getByRole('searchbox', { name: 'Search components' });
}

describe('ComponentSearch', () => {
  it('lists every component under its level until something is typed', () => {
    render(<ComponentSearch levels={LEVELS} cards={CARDS} />);

    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(screen.getByRole('status')).toHaveTextContent('3 components');
  });

  it('narrows the cards as a name is typed, and leaves out a level with none left', async () => {
    const user = userEvent.setup();
    render(<ComponentSearch levels={LEVELS} cards={CARDS} />);

    await user.type(search(), 'bad');

    expect(screen.getByRole('link', { name: 'Badge' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Button' })).toBeNull();
    expect(screen.queryByRole('region', { name: /Molecules/ })).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('1 of 3 components');
  });

  it('says so when nothing matches', async () => {
    const user = userEvent.setup();
    render(<ComponentSearch levels={LEVELS} cards={CARDS} />);

    await user.type(search(), 'carousel');

    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(
      screen.getByText('No component matches “carousel”.'),
    ).toBeInTheDocument();
  });

  it('jumps to the search on /, without typing it', async () => {
    const user = userEvent.setup();
    render(<ComponentSearch levels={LEVELS} cards={CARDS} />);

    await user.keyboard('/');

    expect(search()).toHaveFocus();
    expect(search()).toHaveValue('');
  });
});
