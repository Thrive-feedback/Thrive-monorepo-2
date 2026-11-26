import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BackToTop } from './back-to-top';

/**
 * Tells the button whether the page's head is in view, as the browser's observer would: out of view,
 * it has scrolled up past the window's top.
 */
let headIsInView: (inView: boolean) => void;
/** Tells the button the head is out of view below the window, as on a short one at the top. */
let headIsBelowWindow: () => void;
const scrollTo = vi.fn();
let motionIsUnwelcome = false;

beforeEach(() => {
  scrollTo.mockReset();
  motionIsUnwelcome = false;
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(
        callback: (
          entries: {
            isIntersecting: boolean;
            boundingClientRect: { top: number };
          }[],
        ) => void,
      ) {
        headIsInView = (inView) =>
          callback([
            {
              isIntersecting: inView,
              boundingClientRect: { top: inView ? 0 : -40 },
            },
          ]);
        headIsBelowWindow = () =>
          callback([
            { isIntersecting: false, boundingClientRect: { top: 900 } },
          ]);
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('scrollTo', scrollTo);
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: motionIsUnwelcome,
    media: query,
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function Page() {
  return (
    <>
      <h1 id="heading" tabIndex={-1}>
        Acme home
      </h1>
      <div id="head-end" />
      <BackToTop headingId="heading" pastId="head-end" />
    </>
  );
}

describe('BackToTop', () => {
  it('stays out of reach while the head of the page is in view', () => {
    render(<Page />);
    act(() => headIsInView(true));

    expect(screen.getByRole('button', { name: 'Back to top' })).toHaveAttribute(
      'inert',
    );
  });

  it('stays out of reach while the head is below a short window, not yet scrolled past', () => {
    render(<Page />);
    act(() => headIsBelowWindow());

    expect(screen.getByRole('button', { name: 'Back to top' })).toHaveAttribute(
      'inert',
    );
  });

  it('takes the reader back up, gently, and gives the heading focus', async () => {
    render(<Page />);
    act(() => headIsInView(false));

    await userEvent.click(screen.getByRole('button', { name: 'Back to top' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(screen.getByRole('heading', { name: 'Acme home' })).toHaveFocus();
  });

  it('jumps rather than glides when motion is unwelcome', async () => {
    motionIsUnwelcome = true;
    render(<Page />);
    act(() => headIsInView(false));

    await userEvent.click(screen.getByRole('button', { name: 'Back to top' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });

  it('comes within reach once the head has scrolled away, and goes again when it returns', () => {
    render(<Page />);
    const button = screen.getByRole('button', { name: 'Back to top' });

    act(() => headIsInView(false));
    expect(button).not.toHaveAttribute('inert');

    act(() => headIsInView(true));
    expect(button).toHaveAttribute('inert');
  });
});
