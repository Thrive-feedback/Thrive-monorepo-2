import { describe, expect, it } from 'bun:test';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import {
  aProfileSnapshot,
  FakeProfileRepository,
} from '@test/support/identity.fakes';
import { FullNameEmptyError } from '../../domain/profile.errors';
import {
  ProfileAlreadyExistsError,
  ProfileSlugTakenError,
} from '../profile.errors';
import { CreateProfileUseCase } from './create-profile.use-case';

const PROFILE_ID = '0199a0f0-0000-7000-8000-0000000000aa';

function introduction(overrides: Partial<{ email: string }> = {}) {
  return {
    accountId: 'account-new',
    email: 'ann.lee@company.com',
    fullName: '  Ann   Lee ',
    displayName: 'Ann',
    ...overrides,
  };
}

function useCaseWith(profileRepository: FakeProfileRepository) {
  return new CreateProfileUseCase(
    profileRepository,
    new FakeIdGenerator(PROFILE_ID),
  );
}

describe('introducing yourself', () => {
  it('saves the Profile with tidied names and a slug made from the email', async () => {
    const profileRepository = new FakeProfileRepository();

    const created = await useCaseWith(profileRepository).execute(
      introduction(),
    );

    expect(created).toEqual({ id: PROFILE_ID });
    expect(profileRepository.saved).toEqual([
      {
        id: PROFILE_ID,
        accountId: 'account-new',
        fullName: 'Ann Lee',
        displayName: 'Ann',
        slug: 'ann.lee',
      },
    ]);
  });

  it('adds the next free number when the slug is already taken', async () => {
    const profileRepository = new FakeProfileRepository().holding(
      aProfileSnapshot({ accountId: 'account-1', slug: 'ann.lee' }),
      aProfileSnapshot({ accountId: 'account-2', slug: 'ann.lee-2' }),
    );

    await useCaseWith(profileRepository).execute(
      introduction({ email: 'ann.lee@gmail.com' }),
    );

    expect(profileRepository.saved.at(-1)?.slug).toBe('ann.lee-3');
  });

  it('takes the next slug when someone else saves the same one first', async () => {
    const profileRepository = new FakeProfileRepository();
    profileRepository.slugsTakenOnSave.push('ann.lee');

    await useCaseWith(profileRepository).execute(introduction());

    expect(profileRepository.saved.at(-1)?.slug).toBe('ann.lee-2');
  });

  it('gives up when it keeps losing the race for a slug', async () => {
    const profileRepository = new FakeProfileRepository();
    profileRepository.slugsTakenOnSave.push(
      'ann.lee',
      'ann.lee-2',
      'ann.lee-3',
      'ann.lee-4',
      'ann.lee-5',
    );

    await expect(
      useCaseWith(profileRepository).execute(introduction()),
    ).rejects.toThrow(ProfileSlugTakenError);
  });

  it('is refused when the Account has already introduced itself', async () => {
    const profileRepository = new FakeProfileRepository().holding(
      aProfileSnapshot({ accountId: 'account-new' }),
    );

    await expect(
      useCaseWith(profileRepository).execute(introduction()),
    ).rejects.toThrow(ProfileAlreadyExistsError);
  });

  it('saves nothing when a name breaks its rules', async () => {
    const profileRepository = new FakeProfileRepository();

    await expect(
      useCaseWith(profileRepository).execute({
        ...introduction(),
        fullName: '   ',
      }),
    ).rejects.toThrow(FullNameEmptyError);
    expect(profileRepository.saved).toEqual([]);
  });
});
