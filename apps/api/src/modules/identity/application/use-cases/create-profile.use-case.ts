import { IdGenerator } from '@app/shared/application/id-generator.port';
import { Injectable } from '@nestjs/common';
import { Profile } from '../../domain/entity/profile.entity';
import { ProfileRepository } from '../../domain/repository/profile-repository.port';
import { DisplayName } from '../../domain/value-object/display-name.vo';
import { FullName } from '../../domain/value-object/full-name.vo';
import { ProfileSlug } from '../../domain/value-object/profile-slug.vo';
import {
  ProfileAlreadyExistsError,
  ProfileSlugTakenError,
} from '../profile.errors';

export interface CreateProfileInput {
  readonly accountId: string;
  /** The Account's email, which the slug is made from. */
  readonly email: string;
  readonly fullName: string;
  readonly displayName: string;
}

export interface CreateProfileResult {
  readonly id: string;
}

/** Slugs checked per query while looking for a free one. */
const SLUG_CANDIDATES_PER_QUERY = 20;

/** Saves that may lose a race for the slug before giving up. */
const MAX_SAVE_ATTEMPTS = 5;

/** The person introduces themselves, which creates their Profile and fixes its slug. */
@Injectable()
export class CreateProfileUseCase {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: CreateProfileInput): Promise<CreateProfileResult> {
    const fullName = FullName.of(input.fullName);
    const displayName = DisplayName.of(input.displayName);

    if (
      (await this.profileRepository.findByAccountId(input.accountId)) !== null
    ) {
      throw new ProfileAlreadyExistsError();
    }

    const wanted = ProfileSlug.fromEmail(input.email);
    const id = this.idGenerator.next();

    for (let attempt = 1; ; attempt += 1) {
      const profile = Profile.introduce({
        id,
        accountId: input.accountId,
        fullName,
        displayName,
        slug: await this.firstFreeSlug(wanted),
      });
      try {
        await this.profileRepository.save(profile);
        return { id };
      } catch (error) {
        // Two people with the same name before `@` can save at the same moment. The
        // loser picks the next free slug rather than failing.
        if (
          !(error instanceof ProfileSlugTakenError) ||
          attempt === MAX_SAVE_ATTEMPTS
        ) {
          throw error;
        }
      }
    }
  }

  private async firstFreeSlug(wanted: ProfileSlug): Promise<ProfileSlug> {
    for (let from = 1; ; from += SLUG_CANDIDATES_PER_QUERY) {
      const candidates = wanted.candidates(from, SLUG_CANDIDATES_PER_QUERY);
      const taken = await this.profileRepository.takenSlugs(candidates);
      const free = ProfileSlug.firstFree(candidates, taken);
      if (free !== null) {
        return free;
      }
    }
  }
}
