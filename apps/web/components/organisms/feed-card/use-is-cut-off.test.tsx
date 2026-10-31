import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIsCutOff } from './use-is-cut-off';

function Text({ isClamped }: { isClamped: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const isCutOff = useIsCutOff(ref, isClamped);

  return <p ref={ref}>{isCutOff ? 'cut off' : 'all of it'}</p>;
}

/** How tall the words are against the two lines they are given. */
function measuringAs(scrollHeight: number) {
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(
    scrollHeight,
  );
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(40);
}

let resized: (() => void) | undefined;
const disconnect = vi.fn();

beforeEach(() => {
  disconnect.mockClear();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resized = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useIsCutOff', () => {
  it('says nothing is cut off when the words fit', () => {
    measuringAs(40);

    render(<Text isClamped />);

    expect(screen.getByText('all of it')).toBeInTheDocument();
  });

  it('says so when the words run past the clamp', () => {
    measuringAs(80);

    render(<Text isClamped />);

    expect(screen.getByText('cut off')).toBeInTheDocument();
  });

  it('measures again when the screen turns narrower, and wider', () => {
    measuringAs(40);
    render(<Text isClamped />);

    measuringAs(80);
    act(() => resized?.());
    expect(screen.getByText('cut off')).toBeInTheDocument();

    measuringAs(40);
    act(() => resized?.());
    expect(screen.getByText('all of it')).toBeInTheDocument();
  });

  it('keeps its answer while the clamp is off, or the way back would go', () => {
    measuringAs(80);
    const { rerender } = render(<Text isClamped />);

    measuringAs(40);
    rerender(<Text isClamped={false} />);

    expect(screen.getByText('cut off')).toBeInTheDocument();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
