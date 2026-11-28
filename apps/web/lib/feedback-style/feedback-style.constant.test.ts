import { describe, expect, it } from 'vitest';
import { parseFeedbackStyle } from './feedback-style.constant';

describe('parseFeedbackStyle', () => {
  it('reads either style', () => {
    expect(parseFeedbackStyle('plain')).toBe('plain');
    expect(parseFeedbackStyle('postcard')).toBe('postcard');
  });

  it('reads anything else, or nothing, as the postcard', () => {
    expect(parseFeedbackStyle(undefined)).toBe('postcard');
    expect(parseFeedbackStyle('PLAIN')).toBe('postcard');
    expect(parseFeedbackStyle(1)).toBe('postcard');
  });
});
