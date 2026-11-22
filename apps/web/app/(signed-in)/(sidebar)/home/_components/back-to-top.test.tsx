import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BackToTop } from './back-to-top';

/** Tells the button whether the heading is in view, as the browser's observer would. */
let headingIsInView: (inView: boolean) => void;
const scrollTo = vi.fn();
let motionIsUnwelcome = false;

beforeEach(() => {
  scrollTo.mockReset();
  motionIsUnwelcome = false;
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        headingIsInView = (inView) => callback([{ isIntersecting: inView }]);
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
      <BackToTop headingId="heading" />
    </>
  );
}

describe('BackToTop', () => {
  it('stays out of reach while the heading is in view', () => {
    render(<Page />);
    act(() => headingIsInView(true));

    expect(screen.getByRole('button', { name: 'Back to top' })).toHaveAttribute(
      'inert',
    );
  });

  it('takes the reader back up, gently, and gives the heading focus', async () => {
    render(<Page />);
    act(() => headingIsInView(false));

    await userEvent.click(screen.getByRole('button', { name: 'Back to top' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(screen.getByRole('heading', { name: 'Acme home' })).toHaveFocus();
  });

  it('jumps rather than glides when motion is unwelcome', async () => {
    motionIsUnwelcome = true;
    render(<Page />);
    act(() => headingIsInView(false));

    await userEvent.click(screen.getByRole('button', { name: 'Back to top' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });

  it('comes within reach once the heading leaves view, and goes again when it returns', () => {
    render(<Page />);
    const button = screen.getByRole('button', { name: 'Back to top' });

    act(() => headingIsInView(false));
    expect(button).not.toHaveAttribute('inert');

    act(() => headingIsInView(true));
    expect(button).toHaveAttribute('inert');
  });
});
