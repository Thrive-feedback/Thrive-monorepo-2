import type { ProfileView } from '../types/profile.types';

export abstract class ProfileQuery {
  /** `null` while the Account has not introduced itself yet. */
  abstract profileOfAccount(accountId: string): Promise<ProfileView | null>;
}
