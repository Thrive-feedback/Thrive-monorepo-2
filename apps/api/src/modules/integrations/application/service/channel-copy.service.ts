import { WebConfig } from '@app/config/configuration';
import { WEB_PATHS, webUrl } from '@app/shared/application/web-paths.constant';
import { Injectable } from '@nestjs/common';

/** What a post calls somebody who has not introduced themselves. The sentence has to hold. */
const SOMEBODY = 'Someone';

/**
 * The words a Workspace's channel is told, composed once above the provider registry because they
 * are the same words whichever tool carries them — only the rendering differs, and that belongs in
 * the provider's own adapter.
 *
 * **A channel post says less than a direct message may, and the difference is the point.** A direct
 * message has one reader who is a party to the thing. A channel is read by whoever is in that
 * server, which is not the same set of people as the Workspace: guests and contractors can be in
 * it, Thrive can neither enumerate them nor take a message back. So:
 *
 * - **Feedback carries no words at all** — the Giver, the Receivers, and a link (brain `ADR-0040`).
 *   Choosing *Everyone in the Workspace* is consent to be read by the team in Thrive; it is not
 *   consent to be quoted in a room that may hold the client.
 * - **A Kudos carries its message** (brain `ADR-0045`). It has no Visibility to respect — every
 *   Member reads every Kudos already — it is at most 280 characters, and it is praise written to be
 *   seen. Stripped of its words it would say only that praise happened somewhere else.
 *
 * Both are kept here, in one file, so that staying in step is a file rather than a discipline.
 */
@Injectable()
export class ChannelCopyService {
  constructor(private readonly webConfig: WebConfig) {}

  feedbackPublished(event: {
    readonly giverName: string | null;
    readonly receiverNames: readonly (string | null)[];
    readonly feedbackId: string;
  }): string {
    return [
      `**${named(event.giverName)}** gave **${listOf(event.receiverNames)}** feedback`,
      this.linkTo(WEB_PATHS.feedback(event.feedbackId)),
    ].join('\n');
  }

  kudosGiven(event: {
    readonly giverName: string | null;
    readonly recipientNames: readonly (string | null)[];
    readonly message: string;
  }): string {
    // A Kudos that names nobody is for everyone (ADR 0074), and an empty list would leave a gap.
    const given =
      event.recipientNames.length === 0
        ? 'the whole Workspace'
        : listOf(event.recipientNames);
    return [
      `**${named(event.giverName)}** gave **${given}** kudos`,
      quoted(event.message),
      this.linkTo(WEB_PATHS.home()),
    ].join('\n');
  }

  private linkTo(path: string): string {
    return webUrl(this.webConfig.origin, path);
  }
}

function named(name: string | null): string {
  const trimmed = name?.trim();
  return trimmed === undefined || trimmed === '' ? SOMEBODY : trimmed;
}

/**
 * "Ann", "Ann and Ben", "Ann, Ben and Cat". Offered Feedback has several Receivers and a Kudos is
 * for everybody its message @mentions, so a post naming one person is the exception rather than
 * the rule.
 */
/**
 * The Kudos as it was written, as a quote block. Every line is marked rather than only the first:
 * `>` quotes one line and `>>>` quotes everything after it, including the link, so a Kudos written
 * over several lines needs the marker repeated. Nothing else is done to it — "carries its message"
 * means verbatim (brain `ADR-0045`).
 */
function quoted(message: string): string {
  return message
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

function listOf(names: readonly (string | null)[]): string {
  const people = names.map(named);
  if (people.length <= 1) {
    return people[0] ?? SOMEBODY;
  }
  return `${people.slice(0, -1).join(', ')} and ${people[people.length - 1]}`;
}
