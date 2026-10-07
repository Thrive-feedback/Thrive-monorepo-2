import { describe, expect, it } from 'bun:test';
import { ProfileSlugInvalidError } from '../profile.errors';
import { ProfileSlug } from './profile-slug.vo';

const slugOf = (email: string) => ProfileSlug.fromEmail(email).toString();

describe('a Profile slug made from an email', () => {
  it('is the part before @', () => {
    expect(slugOf('ann.lee@company.com')).toBe('ann.lee');
  });

  it('is the same for a company email and a Gmail with the same name', () => {
    expect(slugOf('ann.lee@gmail.com')).toBe(slugOf('ann.lee@company.com'));
  });

  it('is lowercase and leaves out a +tag', () => {
    expect(slugOf('Ann.Lee+work@gmail.com')).toBe('ann.lee');
  });

  it('turns characters a link cannot carry into a dash', () => {
    expect(slugOf("o'brien!@x.com")).toBe('o-brien');
  });

  it('collapses repeated separators and trims them from both ends', () => {
    expect(slugOf('.Ann..Lee-@x.com')).toBe('ann.lee');
  });

  it('falls back to "member" when nothing usable is left', () => {
    expect(slugOf('+abc@x.com')).toBe('member');
  });

  it('is cut to 64 characters without ending on a separator', () => {
    const slug = slugOf(`${'a'.repeat(63)}.b@x.com`);

    expect(slug).toBe('a'.repeat(63));
  });
});

describe('the slugs tried when one is taken', () => {
  it('are itself, then -2, -3 and on', () => {
    const tried = ProfileSlug.fromEmail('ann.lee@x.com')
      .candidates(1, 3)
      .map(String);

    expect(tried).toEqual(['ann.lee', 'ann.lee-2', 'ann.lee-3']);
  });

  it('shorten a long slug so the number still fits in 64', () => {
    const [second] = ProfileSlug.fromEmail(`${'a'.repeat(64)}@x.com`)
      .candidates(2, 1)
      .map(String);

    expect(second).toBe(`${'a'.repeat(62)}-2`);
  });

  it('settle on the first one nobody holds', () => {
    const candidates = ProfileSlug.fromEmail('ann.lee@x.com').candidates(1, 3);
    const taken = [ProfileSlug.of('ann.lee'), ProfileSlug.of('ann.lee-2')];

    expect(ProfileSlug.firstFree(candidates, taken)?.toString()).toBe(
      'ann.lee-3',
    );
  });

  it('settle on none when every one is held', () => {
    const candidates = ProfileSlug.fromEmail('ann.lee@x.com').candidates(1, 2);

    expect(ProfileSlug.firstFree(candidates, candidates)).toBeNull();
  });
});

describe('a stored Profile slug', () => {
  it('is accepted as it was saved', () => {
    expect(ProfileSlug.of('ann.lee-2').toString()).toBe('ann.lee-2');
  });

  it('is refused when it could not have been made from an email', () => {
    expect(() => ProfileSlug.of('Ann..Lee')).toThrow(ProfileSlugInvalidError);
  });
});
