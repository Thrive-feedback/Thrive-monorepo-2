import { WebConfig } from '@app/config/configuration';
import { Injectable } from '@nestjs/common';

/**
 * A Request message is quoted in a chat message, so it is trimmed to something that reads as one
 * line rather than as a wall. It is capped at 200 characters when it is written, so this only
 * bites the longest ones.
 */
const QUOTED_LENGTH = 120;

/**
 * Where a chat message points, mirroring `apps/web/lib/routes.constant.ts`.
 *
 * The API has no business knowing the web app's addresses, and for the bell it does not — the
 * web composes that itself (design 0022 D12). A chat message is the exception that has to:
 * it leaves Thrive entirely, so it must carry an absolute URL, and only the API is there to
 * build one. Integrations makes the same compromise for its callback path.
 *
 * **These three strings and the web's `ROUTES` have to agree.** Changing a Home dialog
 * parameter without changing them sends people to a page that ignores it.
 */
const WEB_PATHS = {
  ask: (askId: string) => `/home?tab=waiting&ask=${askId}`,
  request: (requestId: string) => `/home?tab=my-requests&request=${requestId}`,
  // No tab: the same Feedback sits on the Workspace feed, Shared with me or Feedback for me
  // depending on who follows the link, so no tab is true for every reader. Matches
  // `ROUTES.homeFeedback`.
  feedback: (feedbackId: string) => `/home?feedback=${feedbackId}`,
} as const;

/**
 * The words a chat tool carries, composed once above the provider registry because they are the
 * same words whichever tool delivers them — only the rendering differs, and that belongs in the
 * provider's own adapter (design 0021 §4.2).
 *
 * **These may say more than a channel post may.** A direct message has exactly one reader and
 * that reader is a party to the thing, so naming who asked and what about satisfies `ADR 0039`
 * rather than bending it — which is the whole reason `ADR-0035` chose a bot over a pasted
 * channel address. The channel post, by contrast, can only ever name who gave Feedback to whom
 * (`ADR-0040`).
 *
 * **In-app copy is not here.** The bell is composed in the web app, because its destination is a
 * web route and `ROUTES` is not the API's to know (design 0022 D12). This service exists because
 * a chat message must carry an absolute URL, which only the API can build.
 */
@Injectable()
export class ChatCopyService {
  constructor(private readonly webConfig: WebConfig) {}

  askReceived(event: {
    readonly actorName: string;
    readonly workspaceName: string;
    readonly requestMessage: string;
    readonly askId: string;
  }): string {
    return [
      `**${event.actorName}** asked you for feedback in *${event.workspaceName}*`,
      `> ${quoted(event.requestMessage)}`,
      this.linkTo(WEB_PATHS.ask(event.askId)),
    ].join('\n');
  }

  askAnswered(event: {
    readonly actorName: string;
    readonly workspaceName: string;
    readonly feedbackRequestId: string;
  }): string {
    // Nothing of what was written: a chat client keeps messages on the person's own machine and
    // in the tool's history, and the answer is the part of Feedback people are most careful
    // about. The link does that job, behind a sign-in (#214).
    return [
      `**${event.actorName}** answered your feedback request in *${event.workspaceName}*`,
      this.linkTo(WEB_PATHS.request(event.feedbackRequestId)),
    ].join('\n');
  }

  feedbackWritten(event: {
    readonly actorName: string;
    readonly workspaceName: string;
    readonly feedbackId: string;
    /** Written *to* them, or shared *with* them — the same arrival, worded for each. */
    readonly isReceiver: boolean;
  }): string {
    const opening = event.isReceiver
      ? `**${event.actorName}** wrote feedback to you in *${event.workspaceName}*`
      : `**${event.actorName}** shared feedback with you in *${event.workspaceName}*`;
    return [opening, this.linkTo(WEB_PATHS.feedback(event.feedbackId))].join(
      '\n',
    );
  }

  /** The origin is the deployment's, read from configuration rather than guessed. */
  private linkTo(path: string): string {
    return `${this.webConfig.origin}${path}`;
  }
}

function quoted(message: string): string {
  const oneLine = message.replace(/\s+/g, ' ').trim();
  return oneLine.length > QUOTED_LENGTH
    ? `${oneLine.slice(0, QUOTED_LENGTH).trimEnd()}…`
    : oneLine;
}
