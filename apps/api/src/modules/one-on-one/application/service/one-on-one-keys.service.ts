/**
 * The unit-of-work key for two people's 1:1s in one Workspace, the same whichever of them is named
 * first, so two requests starting a 1:1 between the same people wait for each other rather than
 * both passing the "none open yet" check.
 */
export function oneOnOnePairKey(
  workspaceId: string,
  firstAccountId: string,
  secondAccountId: string,
): string {
  return `one-on-one:${workspaceId}:${[firstAccountId, secondAccountId].sort().join(':')}`;
}

/**
 * The unit-of-work key for one 1:1, taken by every write to it: answering, rescheduling and ending
 * it, and every write to its meetings. Two writes to one 1:1 wait for each other, so neither is lost
 * under the other and no meeting opens on a 1:1 being ended.
 */
export function oneOnOneKey(oneOnOneId: string): string {
  return `one-on-one:${oneOnOneId}`;
}
