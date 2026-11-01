import { OutboxRelay } from '@app/infrastructure/outbox/outbox-relay.service';
import { harness } from './harness';

/**
 * Delivers everything the scenario enqueued, and waits for it.
 *
 * Notifications and channel announcements are recorded in the writer's transaction and delivered
 * when the outbox drains (ADR 0076). The relay's own poller is stopped for these scenarios, so a
 * step that wants to see the result drains first — which makes the assertion deterministic
 * rather than a race against a background tick.
 *
 * Until nothing is left, because one tick claims a batch and a scenario may have enqueued more.
 */
export async function drainOutbox(): Promise<void> {
  const relay = harness().app.get(OutboxRelay);
  for (;;) {
    const { claimed } = await relay.drainOnce();
    if (claimed === 0) return;
  }
}
