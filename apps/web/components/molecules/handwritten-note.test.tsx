import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HandwrittenNote } from './handwritten-note';

describe('HandwrittenNote', () => {
  it('is written in the margin, and a screen reader skips it', () => {
    render(<HandwrittenNote>see you inside</HandwrittenNote>);

    expect(screen.getByText('see you inside')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it.each([
    ['lg', 'font-handwrite text-subtitle-handwrite-1'],
    ['md', 'font-handwrite text-subtitle-handwrite-2'],
  ] as const)('writes at %s', (size, className) => {
    render(<HandwrittenNote size={size}>see you inside</HandwrittenNote>);

    expect(screen.getByText('see you inside')).toHaveClass(className);
  });
});
