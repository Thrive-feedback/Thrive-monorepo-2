import { describe, expect, it } from 'bun:test';
import { TeamSizeInvalidError } from '../workspace.errors';
import { TeamSize } from './team-size.vo';

describe('a team size', () => {
  it('is one of the sizes offered when creating a Workspace', () => {
    expect(TeamSize.of('OVER_50').toString()).toBe('OVER_50');
  });

  it('is refused when it is not one of them', () => {
    expect(() => TeamSize.of('HUNDREDS')).toThrow(TeamSizeInvalidError);
  });
});
