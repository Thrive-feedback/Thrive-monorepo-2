import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEndlessList } from './use-endless-list';

const FIRST_PAGE = { items: ['one'], nextCursor: 'cursor-1' };

class NeverSeesTheEnd {
  observe() {}
  disconnect() {}
}

type ListProps = {
  readNext: (
    cursor: string,
  ) => Promise<{ items: string[]; nextCursor: null } | null>;
  onRejected: (error: unknown) => void;
};

function List({ readNext, onRejected }: ListProps) {
  const { items, phase, readNextPage } = useEndlessList(FIRST_PAGE, readNext);
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
});
