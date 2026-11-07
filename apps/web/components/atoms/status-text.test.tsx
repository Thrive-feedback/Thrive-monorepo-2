import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusText, type StatusTone } from './status-text';

describe('StatusText', () => {
  it.each<[StatusTone, string]>([
    ['success', 'text-status-success-active'],
    ['warning', 'text-status-warning-active'],
    ['error', 'text-status-error-active'],
    ['info', 'text-status-info-active'],
  ])('says a %s status as its word, in that status colour', (tone, ink) => {
    render(
      <p>
        Asked 3 people (<StatusText tone={tone}>2 answered</StatusText>)
      </p>,
    );

    const word = screen.getByText('2 answered');
    expect(word).toHaveClass(ink);
    // Part of the sentence around it, not a separate badge: the line still reads as one.
    expect(word.closest('p')).toHaveTextContent('Asked 3 people (2 answered)');
  });
});
