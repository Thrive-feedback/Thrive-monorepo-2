/** Why accepting did not go through, when the page stays put to say so. */
export type AcceptInvitationRefusal =
  | 'notForYou'
  | 'alreadyInAWorkspace'
  | 'failed';

export type AcceptInvitationState = {
  readonly refusal?: AcceptInvitationRefusal;
};
