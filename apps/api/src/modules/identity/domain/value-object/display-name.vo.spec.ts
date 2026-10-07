import { describe, expect, it } from 'bun:test';
import {
  DisplayNameEmptyError,
  DisplayNameTooLongError,
} from '../profile.errors';
import { DisplayName } from './display-name.vo';

describe('a Display name', () => {
  it('drops surrounding spaces and collapses repeated ones', () => {
    expect(DisplayName.of(" P'Mod  Ton ").toString()).toBe("P'Mod Ton");
  });

  it('is refused when it is only spaces', () => {
    expect(() => DisplayName.of(' ')).toThrow(DisplayNameEmptyError);
  });

  it('is accepted at exactly 50 characters', () => {
    expect(DisplayName.of('a'.repeat(50)).toString()).toHaveLength(50);
  });

  it('is refused past 50 characters', () => {
    expect(() => DisplayName.of('a'.repeat(51))).toThrow(
      DisplayNameTooLongError,
    );
  });
});
