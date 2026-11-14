import { describe, expect, it } from 'bun:test';
import { FakeClock } from '@test/support/clock.fake';
import { FakeOutbox } from '@test/support/outbox.fake';
import { SUMMARY_REFRESH_TYPE } from '../adapter/feedback-summary-outbox.adapter';
import { SummaryRefreshService } from './summary-refresh.service';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-00000000000a';
const SOURCE_ID = '0199a0f0-0000-7000-8000-0000000000f1';
const NOW = new Date('2026-11-08T09:00:00.000Z');

function setUp() {
  const outbox = new FakeOutbox();
  return {
    outbox,
    service: new SummaryRefreshService(outbox, new FakeClock(NOW)),
  };
}

function members(count: number): string[] {
  return Array.from({ length: count }, (_unused, index) => `account-${index}`);
}

describe('asking for the summaries a write made out of date', () => {
  it('asks for one per Member it was written to', async () => {
    const { outbox, service } = setUp();

    await service.askFor({
      workspaceId: WORKSPACE_ID,
      accountIds: members(3),
      sourceId: SOURCE_ID,
    });

    expect(outbox.ofType(SUMMARY_REFRESH_TYPE)).toHaveLength(3);
  });

  it('names the quarter the write happened in', async () => {
    const { outbox, service } = setUp();

    await service.askFor({
      workspaceId: WORKSPACE_ID,
      accountIds: members(1),
      sourceId: SOURCE_ID,
    });

    expect(outbox.ofType(SUMMARY_REFRESH_TYPE)[0]?.payload).toMatchObject({
      period: '2026-Q4',
      workspaceId: WORKSPACE_ID,
    });
  });

  it('caps what one write can spend, however many people it was written to', async () => {
    const { outbox, service } = setUp();

    // A piece of Feedback may name fifty Receivers, and each summary is a paid model call.
    await service.askFor({
      workspaceId: WORKSPACE_ID,
      accountIds: members(50),
      sourceId: SOURCE_ID,
    });

    expect(outbox.ofType(SUMMARY_REFRESH_TYPE)).toHaveLength(10);
  });

  it('asks for nothing when a Kudos named nobody', async () => {
    const { outbox, service } = setUp();

    await service.askFor({
      workspaceId: WORKSPACE_ID,
      accountIds: [],
      sourceId: SOURCE_ID,
    });

    expect(outbox.enqueued).toHaveLength(0);
  });
});
