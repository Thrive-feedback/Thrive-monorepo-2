/** What a Profile item is: a piece of Feedback, a Kudos, or an Ask still open between two Members. */
export type ProfileItemKind = 'FEEDBACK' | 'KUDOS' | 'ASK';

/**
 * Published: whether one item is on a Member's Profile for one reader (brain ADR-0063), for a module
 * that lets the reader bring it somewhere both of them read, as a 1:1's agenda does. An item there is
 * one the reader may already read, and so is the Member, so bringing it shows nobody anything new.
 *
 * It answers a fact and nothing else: the item itself, and the lists, stay with Feedback, which a
 * screen reads through Feedback's own routes.
 */
export abstract class FeedbackAboutPersonPort {
  /**
   * Whether `readerAccountId` finds this item on `aboutAccountId`'s Profile: in what everyone sees,
   * or in what is for the reader. Whenever it was written; `false` for an id that is not there.
   */
  abstract isOnProfileFor(input: {
    readonly workspaceId: string;
    /** The signed-in caller, always. */
    readonly readerAccountId: string;
    readonly aboutAccountId: string;
    readonly kind: ProfileItemKind;
    readonly id: string;
  }): Promise<boolean>;
}
