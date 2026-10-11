import type { components } from '@repo/api';

export type TeamSize = NonNullable<
  components['schemas']['CreateWorkspaceRequestDto']['teamSize']
>;

/** The sizes the API accepts, each with the words the founder picks it by. */
export const TEAM_SIZES = [
  { value: 'JUST_ME', label: 'Just me' },
  { value: 'FROM_2_TO_10', label: '2–10' },
  { value: 'FROM_11_TO_50', label: '11–50' },
  { value: 'OVER_50', label: '50+' },
] as const satisfies readonly { value: TeamSize; label: string }[];
