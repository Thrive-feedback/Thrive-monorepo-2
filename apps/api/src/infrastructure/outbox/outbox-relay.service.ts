import { Clock } from '@app/shared/application/clock.port';
import {
  OutboxHandlerRegistry,
  type OutboxMessageRead,
  UnprocessableOutboxMessage,
} from '@app/shared/application/outbox-handler.port';
import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

/** How often a replica looks for due work. Every replica polls; see ADR 0076 on standing load. */
export const POLL_INTERVAL_MS = 2_000;
/**
 * How long the relay waits between ticks, as an injected value: a default on the parameter is
 * invisible to Nest, which reads constructor types from `design:paramtypes` and would look for
 * a provider called `Number`.
 */
export const OUTBOX_POLL_INTERVAL_MS = Symbol('OUTBOX_POLL_INTERVAL_MS');
/** Claimed together. Small, because the batch is worked through one at a time. */
const CLAIM_BATCH_SIZE = 20;
/** A model answers in seconds and a chat tool in hundreds of milliseconds; this covers both. */
const HANDLER_TIMEOUT_MS = 30_000;
const RETRY_BASE_DELAY_MS = 1_000;
const DELIVERED_RETENTION_DAYS = 7;
/** Capped so the sweep can never become the slow half of a tick. */
const SWEEP_BATCH_SIZE = 500;
/** Postgres keeps the whole value; a refusal long enough to need more is already unreadable. */
const MAX_LAST_ERROR_LENGTH = 500;

interface ClaimedRow {
  id: string;
  type: string;
  version: number;
  payload: unknown;
  attempts: number;
}

export interface DrainReport {
  claimed: number;
  delivered: number;
  retried: number;
  dead: number;
}

/**
 * Drains {@link OutboxMessage} in the API process, on every replica (ADR 0076).
 *
 * Three short steps per tick and **no transaction held across a handler**: claim, work, settle.
 * Claiming leases a row by pushing `availableAt` forward, so a relay that dies mid-batch leaves
 * rows that become due again on their own, with the attempt already counted.
 *
 * `FOR UPDATE SKIP LOCKED` rather than one elected leader: two relays never claim the same row,
 * so this is correct whatever the replica count — which is a deployment setting this repository
 * cannot read.
 */
@Injectable()
export class OutboxRelay
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(OutboxRelay.name);
  private timer: NodeJS.Timeout | undefined;
  private inFlight: Promise<DrainReport> | undefined;
  private stopping = false;
  private polling = true;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly handlers: OutboxHandlerRegistry,
    private readonly clock: Clock,
    /**
     * Injected so a test can drive the loop without waiting two seconds for it, the same way
     * the outbound adapters inject their `Wait`.
     */
    @Inject(OUTBOX_POLL_INTERVAL_MS)
    private readonly pollIntervalMs: number = POLL_INTERVAL_MS,
  ) {}

  onApplicationBootstrap(): void {
    this.scheduleNextTick();
  }

  /**
   * Stops the loop and waits for the tick already running, so a deploy does not cut a handler off
   * between doing the work and recording that it was done. `main.ts` enables shutdown hooks, so
   * this fires on SIGTERM.
   */
  async onApplicationShutdown(): Promise<void> {
    this.stopping = true;
    this.stopPolling();
    await this.inFlight?.catch(() => undefined);
  }

  /**
   * Stops the timer without ending the relay: {@link drainOnce} still works.
   *
   * The Gherkin suite calls this after boot and drains by hand. A poller ticking behind a few
   * hundred scenarios would race whatever each one is asserting, and a test that fails once a
   * fortnight is worse than no test at all.
   */
  stopPolling(): void {
    this.polling = false;
    if (this.timer !== undefined) clearTimeout(this.timer);
  }

  /**
   * One tick, awaited. The scenarios and the integration tests call this instead of waiting for
   * the timer: a background poller under 200-odd Gherkin scenarios is a flake generator.
   */
  async drainOnce(): Promise<DrainReport> {
    const report: DrainReport = {
      claimed: 0,
      delivered: 0,
      retried: 0,
      dead: 0,
    };
    const claimed = await this.claim();
    report.claimed = claimed.length;

    for (const row of claimed) {
      if (this.stopping) break;
      const outcome = await this.work(row);
      report[outcome] += 1;
    }

    await this.sweepDelivered();

    if (report.claimed > 0) {
      this.logger.log({ event: 'outbox.drained', ...report });
    }
    return report;
  }

  private scheduleNextTick(): void {
    if (this.stopping || !this.polling) return;
    // A chain rather than setInterval, which stacks ticks when one runs longer than the gap.
    this.timer = setTimeout(() => {
      this.inFlight = this.drainOnce();
      void this.inFlight
        .catch((error: unknown) => {
          this.logger.warn({
            event: 'outbox.tick_failed',
            reason: reasonOf(error),
          });
          return undefined as unknown as DrainReport;
        })
        .finally(() => {
          this.inFlight = undefined;
          this.scheduleNextTick();
        });
    }, this.pollIntervalMs);
    // Nothing is owed if the process is otherwise finished.
    this.timer.unref?.();
  }

  /**
   * Leases a batch and counts the attempt in one statement. Two statements could be interrupted
   * between them, and the interruption would leave a row claimed but uncounted — which retries
   * for ever.
   */
  private async claim(): Promise<ClaimedRow[]> {
    // Postgres's clock, not the application's: every replica leases against one reading, so a
    // machine whose clock drifts cannot claim a row early or hold it late.
    return this.prismaService.$queryRaw<ClaimedRow[]>`
      UPDATE "outbox_message"
         SET "attempts" = "attempts" + 1,
             "availableAt" = now() + make_interval(secs => (${RETRY_BASE_DELAY_MS}::int * power(2, "attempts")) / 1000.0)
       WHERE "id" IN (
         SELECT "id" FROM "outbox_message"
          WHERE "deliveredAt" IS NULL
            AND "deadAt" IS NULL
            AND "availableAt" <= now()
          ORDER BY "availableAt", "id"
            FOR UPDATE SKIP LOCKED
          LIMIT ${CLAIM_BATCH_SIZE})
      RETURNING "id", "type", "version", "payload", "attempts"`;
  }

  private async work(
    row: ClaimedRow,
  ): Promise<'delivered' | 'retried' | 'dead'> {
    const handler = this.handlers.handlerFor(row.type);
    if (handler === undefined) {
      // Enqueued by a version since deployed away: nothing will ever claim it.
      await this.markDead(row.id, `no handler for type ${row.type}`);
      this.logger.warn({
        event: 'outbox.message_dead',
        type: row.type,
        attempts: row.attempts,
        reason: 'no_handler',
      });
      return 'dead';
    }

    const message: OutboxMessageRead = {
      id: row.id,
      type: row.type,
      version: row.version,
      payload: row.payload,
      attempts: row.attempts,
    };

    try {
      await withTimeout(handler.handle(message), HANDLER_TIMEOUT_MS);
      await this.markDelivered(row.id);
      return 'delivered';
    } catch (error: unknown) {
      const reason = reasonOf(error);
      const spent = row.attempts >= handler.maxAttempts;
      if (error instanceof UnprocessableOutboxMessage || spent) {
        await this.markDead(row.id, reason);
        this.logger.warn({
          event: 'outbox.message_dead',
          type: row.type,
          attempts: row.attempts,
          reason:
            error instanceof UnprocessableOutboxMessage
              ? 'unprocessable'
              : 'attempts_spent',
        });
        return 'dead';
      }
      // A plain rejection needs no write beyond the reason: claiming already scheduled the retry.
      await this.recordFailure(row.id, reason);
      return 'retried';
    }
  }

  private async markDelivered(id: string): Promise<void> {
    await this.prismaService.outboxMessage.update({
      where: { id },
      data: { deliveredAt: this.clock.now(), lastError: null },
    });
  }

  private async markDead(id: string, reason: string): Promise<void> {
    await this.prismaService.outboxMessage.update({
      where: { id },
      data: { deadAt: this.clock.now(), lastError: truncate(reason) },
    });
  }

  private async recordFailure(id: string, reason: string): Promise<void> {
    await this.prismaService.outboxMessage.update({
      where: { id },
      data: { lastError: truncate(reason) },
    });
  }

  private async sweepDelivered(): Promise<void> {
    const cutoff = new Date(
      this.clock.now().getTime() -
        DELIVERED_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );
    await this.prismaService.$executeRaw`
      DELETE FROM "outbox_message"
       WHERE "id" IN (
         SELECT "id" FROM "outbox_message"
          WHERE "deliveredAt" IS NOT NULL AND "deliveredAt" < ${cutoff}
          LIMIT ${SWEEP_BATCH_SIZE})`;
  }
}

/**
 * A handler that overruns is abandoned, not cancelled — it may still finish and act. That is
 * precisely why every handler has to be idempotent.
 */
function withTimeout<T>(work: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`handler exceeded ${milliseconds}ms`)),
      milliseconds,
    );
    work.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

/** The refusal, never the payload: a message body must not reach a log (BE_20). */
function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown';
}

function truncate(reason: string): string {
  return reason.length > MAX_LAST_ERROR_LENGTH
    ? reason.slice(0, MAX_LAST_ERROR_LENGTH)
    : reason;
}
