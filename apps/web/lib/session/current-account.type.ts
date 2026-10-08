import type { components } from '@repo/api';

/** What a person told Thrive when they introduced themselves. */
export type CurrentProfile = {
  readonly fullName: string;
  readonly displayName: string;
  readonly slug: string;
};

/** The signed-in Account, as the sign-in and register screens show it. */
export type CurrentAccount = {
  readonly email: string;
  /** The name Google gave, which pre-fills Introduce yourself. */
  readonly name: string;
  /** `null` until the person has introduced themselves. */
  readonly profile: CurrentProfile | null;
};

export type MemberRole =
  components['schemas']['ListMyMembershipsResponseDto_Output']['items'][number]['role'];

/** A Workspace the signed-in person belongs to, and their Role in it. */
export type CurrentMembership = {
  readonly workspace: { readonly id: string; readonly name: string };
  readonly role: MemberRole;
};
