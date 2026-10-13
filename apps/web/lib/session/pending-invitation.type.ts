/** An Invitation the signed-in person could accept now, as they choose which Workspace to join. */
export type PendingInvitation = {
  readonly invitationId: string;
  readonly workspace: { readonly name: string; readonly memberCount: number };
  readonly invitedAt: Date;
};

/** At least one: the page that offers them is only for someone with an Invitation waiting. */
export type PendingInvitations = readonly [
  PendingInvitation,
  ...PendingInvitation[],
];
