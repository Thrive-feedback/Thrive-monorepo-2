import {
  OneOnOneTemplateLimitReachedError,
  OneOnOneTemplateNameTakenError,
  OneOnOneTemplateNotYoursError,
} from '../one-on-one-template.errors';
import {
  OneOnOneTemplateContent,
  type OneOnOneTemplateContentSnapshot,
} from '../value-object/one-on-one-template-content.vo';
import {
  type OneOnOneTemplateRef,
  templateKeyOf,
} from '../value-object/one-on-one-template-ref.vo';

/** How many templates one layer keeps, so a list of them stays short enough to read whole. */
export const MAX_TEMPLATES_PER_LAYER = 30;

/** Who a kept template is for: everyone in its Workspace, or the one Member who wrote it. */
export type OneOnOneTemplateScope = 'WORKSPACE' | 'PERSONAL';

export interface OneOnOneTemplateSnapshot
  extends OneOnOneTemplateContentSnapshot {
  readonly id: string;
  readonly workspaceId: string;
  readonly scope: OneOnOneTemplateScope;
  /** Whose it is, for one kept for one Member; `null` for the Workspace's. */
  readonly ownerAccountId: string | null;
  /** When it was removed, or `null` while it is kept. */
  readonly removedAt: Date | null;
}

/**
 * Whether somebody may change or remove a template of this layer and owner: its owner, for one of
 * their own; an Admin, for the Workspace's. Listing asks it too, so the two never disagree.
 */
export function mayChangeTemplate(
  template: {
    readonly scope: OneOnOneTemplateScope;
    readonly ownerAccountId: string | null;
  },
  by: OneOnOneTemplateActor,
): boolean {
  return template.scope === 'WORKSPACE'
    ? by.isAdmin
    : template.ownerAccountId === by.accountId;
}

/**
 * Whether somebody may start a 1:1 from a template: each of Thrive's; a kept one they see and that is
 * not removed; or whatever the 1:1 already starts from, `keeping`, so either person can change the
 * time without changing a template that is the other's own.
 */
export function mayStartFromTemplate(choice: {
  readonly ref: OneOnOneTemplateRef;
  /** The kept template `ref` names, as stored; `null` for one of Thrive's, or none kept. */
  readonly kept: OneOnOneTemplate | null;
  readonly accountId: string;
  readonly keeping: OneOnOneTemplateRef | null;
}): boolean {
  const { ref, kept, accountId, keeping } = choice;
  if (keeping !== null && templateKeyOf(keeping) === templateKeyOf(ref)) {
    return true;
  }
  return ref.kind === 'THRIVE' || (kept?.isChoosableBy(accountId) ?? false);
}

/** Who is acting on a template: one Member, and whether they are an Admin of its Workspace. */
export interface OneOnOneTemplateActor {
  readonly accountId: string;
  readonly isAdmin: boolean;
}

/**
 * A 1:1 template a Workspace or one Member keeps beside Thrive's own (brain ADR-0060 §8, ADR-0061
 * §6, proposed). The Workspace's are for everyone in it and only its Admins change them; a Member's
 * own are theirs alone, and nobody else sees them. Removing one marks it: it is then listed for
 * nobody and chosen by nobody, though the 1:1s already starting from it keep its questions.
 */
export class OneOnOneTemplate {
  private constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private readonly scope: OneOnOneTemplateScope,
    private readonly ownerAccountId: string | null,
    private content: OneOnOneTemplateContent,
    private removedAt: Date | null,
  ) {}

  /**
   * Refuses keeping `template` in a layer that already holds `kept` (none removed, `template` itself
   * left out): a name taken there in any letter case, or a layer that is full.
   */
  static assertFitsBeside(
    template: OneOnOneTemplate,
    kept: readonly OneOnOneTemplate[],
  ): void {
    const others = kept.filter((each) => each.id !== template.id);
    if (others.some((each) => each.nameKey() === template.nameKey())) {
      throw new OneOnOneTemplateNameTakenError();
    }
    if (others.length >= MAX_TEMPLATES_PER_LAYER) {
      throw new OneOnOneTemplateLimitReachedError(MAX_TEMPLATES_PER_LAYER);
    }
  }

  /** Somebody keeps a new template: for themselves, or, as an Admin, for everyone. */
  static keep(details: {
    readonly id: string;
    readonly workspaceId: string;
    readonly scope: OneOnOneTemplateScope;
    readonly by: OneOnOneTemplateActor;
    readonly content: OneOnOneTemplateContent;
  }): OneOnOneTemplate {
    if (details.scope === 'WORKSPACE' && !details.by.isAdmin) {
      throw new OneOnOneTemplateNotYoursError();
    }
    return new OneOnOneTemplate(
      details.id,
      details.workspaceId,
      details.scope,
      details.scope === 'PERSONAL' ? details.by.accountId : null,
      details.content,
      null,
    );
  }

  /** Rebuilds one already stored; only the repository calls this. */
  static restore(snapshot: OneOnOneTemplateSnapshot): OneOnOneTemplate {
    return new OneOnOneTemplate(
      snapshot.id,
      snapshot.workspaceId,
      snapshot.scope,
      snapshot.ownerAccountId,
      OneOnOneTemplateContent.restore(snapshot),
      snapshot.removedAt,
    );
  }

  /** Whether somebody may see it: the Workspace's are seen by all, a Member's own by them alone. */
  isSeenBy(accountId: string): boolean {
    return this.scope === 'WORKSPACE' || this.ownerAccountId === accountId;
  }

  /** Whether somebody may choose it for a 1:1 now: one they see, not removed. */
  isChoosableBy(accountId: string): boolean {
    return this.removedAt === null && this.isSeenBy(accountId);
  }

  /** Whether somebody may change or remove it: its owner, or an Admin for the Workspace's. */
  isChangeableBy(by: OneOnOneTemplateActor): boolean {
    return mayChangeTemplate(
      { scope: this.scope, ownerAccountId: this.ownerAccountId },
      by,
    );
  }

  isRemoved(): boolean {
    return this.removedAt !== null;
  }

  /** Its name, when to use it and its questions, as rewritten; agendas opened later use them. */
  rewrite(by: OneOnOneTemplateActor, content: OneOnOneTemplateContent): void {
    this.assertChangeableBy(by);
    this.content = content;
  }

  /** Removes it; doing so twice changes nothing more. */
  remove(by: OneOnOneTemplateActor, at: Date): void {
    this.assertChangeableBy(by);
    this.removedAt ??= at;
  }

  snapshot(): OneOnOneTemplateSnapshot {
    return {
      id: this.id,
      workspaceId: this.workspaceId,
      scope: this.scope,
      ownerAccountId: this.ownerAccountId,
      ...this.content.snapshot(),
      removedAt: this.removedAt,
    };
  }

  /** The name compared for being taken in its layer. */
  nameKey(): string {
    return this.content.nameKey();
  }

  private assertChangeableBy(by: OneOnOneTemplateActor): void {
    if (!this.isChangeableBy(by)) {
      throw new OneOnOneTemplateNotYoursError();
    }
  }
}
