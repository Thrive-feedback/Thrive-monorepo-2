import { SUMMARY_REFRESH_TYPE } from '../adapter/feedback-summary-outbox.adapter';
import { SUMMARY_PROMPT_VERSION } from './summary-prompt.service';

/**
 * What makes one request to write a summary the same work as another (ADR 0084).
 *
 * **The Member, the newest message it must account for, and the prompt that will write it.** The
 * message is what makes the work necessary, so the write that made the summary stale and the read
 * that noticed ask for the same thing and cost one generation between them. The prompt version is
 * what lets a changed prompt or a changed stored shape be asked for again: without it the ask
 * would be a duplicate of the one that wrote what is already stored, and an outbox key is unique
 * until its delivered row is swept a week later.
 *
 * The Workspace is left out because an id is already unique across every one of them.
 */
export function summaryRefreshKey(accountId: string, sourceId: string): string {
  return `${SUMMARY_REFRESH_TYPE}:v${SUMMARY_PROMPT_VERSION}:${accountId}:${sourceId}`;
}
