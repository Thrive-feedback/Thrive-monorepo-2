/** Who a chat tool says authorised: its id for them, and the name to show them back. */
export interface LinkedIdentity {
  /** The tool's own space, where it has one. Absent for Discord, stored as `''` (D8). */
  readonly externalTeamId?: string;
  readonly externalUserId: string;
  readonly externalUsername: string;
}

/**
 * Linking one person's own account in one chat tool: the page they are sent to, and the
 * exchange that says who they are.
 *
 * One interface, one implementation per provider, chosen by the provider value (design 0021
 * D3). It is the twin of Integrations' `ChatInstaller`, and deliberately not shared with it: a
 * Workspace adding a bot to a server and a Member proving which account is theirs ask for
 * different rights and return to different addresses.
 *
 * Opening a conversation and posting in it are **not** here. They arrive with the card that
 * sends the first message (#213), where they have a caller; `BE_01` R10 leaves out what is not
 * needed yet rather than shipping it empty.
 */
export abstract class AccountLinker {
  /**
   * Where the Member's browser goes to authorise, carrying `state` so the return can be
   * recognised. It asks for the narrowest right that works: say which account this is, and
   * nothing else (design 0021 D9).
   */
  abstract authorizeUrl(state: string): string;

  /**
   * Trades the authorisation code for the tool's own account of who authorised. The only
   * authenticated proof of which person it was — never anything the browser carried back.
   *
   * The user access token this needs is used inside the call and **discarded**: it is a
   * credential with no consumer, because Thrive messages with its own bot credential. Rejects
   * when the tool refuses the exchange.
   */
  abstract exchangeCode(code: string): Promise<LinkedIdentity>;
}
