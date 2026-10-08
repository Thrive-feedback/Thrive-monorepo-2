import { TeamSizeInvalidError } from '../workspace.errors';

export const TEAM_SIZES = [
  'JUST_ME',
  'FROM_2_TO_10',
  'FROM_11_TO_50',
  'OVER_50',
] as const;

export type TeamSizeValue = (typeof TEAM_SIZES)[number];

function isTeamSize(raw: string): raw is TeamSizeValue {
  return (TEAM_SIZES as readonly string[]).includes(raw);
}

/**
 * How many people the founder says the Workspace is for: Just me, 2–10, 11–50 or 50+.
 * Context for onboarding and sales, never a limit on Seats.
 */
export class TeamSize {
  private constructor(private readonly value: TeamSizeValue) {}

  static of(raw: string): TeamSize {
    if (!isTeamSize(raw)) {
      throw new TeamSizeInvalidError();
    }
    return new TeamSize(raw);
  }

  equals(other: TeamSize): boolean {
    return this.value === other.value;
  }

  toString(): TeamSizeValue {
    return this.value;
  }
}
