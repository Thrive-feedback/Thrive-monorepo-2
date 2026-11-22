import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEndlessList } from './use-endless-list';

const FIRST_PAGE = { items: ['one'], nextCursor: 'cursor-1' };

function itself(item: string) {
  return item;
}

class NeverSeesTheEnd {
  observe() {}
  disconnect() {}
}

type ListProps = {
  readNext: (
    cursor: string,
  ) => Promise<{ items: string[]; nextCursor: string | null } | null>;
  onRejected?: (error: unknown) => void;
};

function List({ readNext, onRejected = () => {} }: ListProps) {
  const { items, phase, readNextPage } = useEndlessList(
    FIRST_PAGE,
    readNext,
    itself,
  );
  return (
    <>
      <p>{items.join()}</p>
      {phase === 'failed' && <p>That page failed.</p>}
      <button type="button" onClick={() => readNextPage().catch(onRejected)}>
        Read on
      </button>
    </>
  );
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', NeverSeesTheEnd);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useEndlessList', () => {
  it('lets a redirect through, as being signed out is no failed page', async () => {
    const signedOut = Object.assign(new Error('NEXT_REDIRECT'), {
      digest: 'NEXT_REDIRECT;replace;/signin;307;',
    });
    const onRejected = vi.fn();
    render(
      <List
        readNext={vi.fn().mockRejectedValue(signedOut)}
        onRejected={onRejected}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Read on' }));

    expect(onRejected).toHaveBeenCalledExactlyOnceWith(signedOut);
    expect(screen.queryByText('That page failed.')).not.toBeInTheDocument();
  });

  it('adds only what it does not already hold, when an item has moved onto the next page', async () => {
    render(
      <List
        readNext={vi
          .fn()
          .mockResolvedValue({ items: ['one', 'two'], nextCursor: null })}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Read on' }));

    expect(await screen.findByText('one,two')).toBeInTheDocument();
  });

  it('reads once when asked twice before the first read is back', async () => {
    let finish: (page: { items: string[]; nextCursor: null }) => void =
      () => {};
    const readNext = vi.fn(
      () =>
        new Promise<{ items: string[]; nextCursor: null }>((resolve) => {
          finish = resolve;
        }),
    );
    render(<List readNext={readNext} />);
    const readOn = screen.getByRole('button', { name: 'Read on' });

    await userEvent.click(readOn);
    await userEvent.click(readOn);
    finish({ items: ['two'], nextCursor: null });

    expect(await screen.findByText('one,two')).toBeInTheDocument();
    expect(readNext).toHaveBeenCalledTimes(1);
  });

  it('starts each read where the one before it ended', async () => {
    const readNext = vi
      .fn()
      .mockResolvedValueOnce({ items: ['two'], nextCursor: 'cursor-2' })
      .mockResolvedValueOnce({ items: ['three'], nextCursor: null });
    render(<List readNext={readNext} />);
    const readOn = screen.getByRole('button', { name: 'Read on' });

    await userEvent.click(readOn);
    await screen.findByText('one,two');
    await userEvent.click(readOn);

    expect(await screen.findByText('one,two,three')).toBeInTheDocument();
    expect(readNext.mock.calls).toEqual([['cursor-1'], ['cursor-2']]);
  });
});
