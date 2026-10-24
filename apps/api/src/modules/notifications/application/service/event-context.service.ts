import { ProfileNamePort } from '@app/modules/identity';
import { WorkspaceNamePort } from '@app/modules/workspace';
import { Injectable } from '@nestjs/common';

/** Somebody with no Profile yet still did the thing, so a message says this rather than nothing. */
const SOMEBODY = 'Someone';

/** A Workspace whose name cannot be read is not named, rather than named wrongly. */
const UNNAMED_WORKSPACE = 'your workspace';

/** What a message needs beyond ids: the two names it puts in a sentence. */
export interface EventContext {
  readonly workspaceName: string;
  readonly actorName: string;
}

/**
 * Resolves the two names every message needs, through what Workspace and Identity publish.
 *
 * It lives here rather than in the ports' arguments because **Feedback does not have them** —
 * its guard only asks whether the caller is a Member, so there is no resolved membership to take
 * a name from (found while building #213; `0021` D11 assumed otherwise).
 *
 * Both reads happen once per event, together, after the caller's transaction has committed. A
 * missing name never stops a message: somebody who has not introduced themselves still asked for
 * Feedback, and the person being told should hear about it.
 */
@Injectable()
export class EventContextService {
  constructor(
    private readonly workspaceNamePort: WorkspaceNamePort,
    private readonly profileNamePort: ProfileNamePort,
  ) {}

  async of(event: {
    readonly workspaceId: string;
    readonly actorAccountId: string;
  }): Promise<EventContext> {
    const [workspaceName, actorName] = await Promise.all([
      this.workspaceNamePort.nameOf(event.workspaceId),
      this.profileNamePort.displayNameOf(event.actorAccountId),
    ]);
    return {
      workspaceName: workspaceName ?? UNNAMED_WORKSPACE,
      actorName: actorName ?? SOMEBODY,
    };
  }
}
