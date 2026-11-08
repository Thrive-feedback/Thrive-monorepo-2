import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { drainOutbox } from '../support/drain-outbox';
import { harness } from '../support/harness';
import type { ThriveWorld } from '../support/world';

interface SummaryPoint {
  readonly point: string;
  readonly sources: readonly string[];
}

interface ReadSummary {
  readonly isStale: boolean;
  readonly sourceCount: number;
  readonly themes: readonly SummaryPoint[];
  readonly strengths: readonly SummaryPoint[];
  readonly areas_to_improve: readonly SummaryPoint[];
  readonly suggested_actions: readonly SummaryPoint[];
}

function summaryRead(world: ThriveWorld): ReadSummary {
  const summary: ReadSummary | null | undefined =
    world.lastResponse?.body?.summary;
  assert.ok(summary, 'No summary was read.');
  return summary;
}

function everyPoint(summary: ReadSummary): readonly SummaryPoint[] {
  return [
    ...summary.themes,
    ...summary.strengths,
    ...summary.areas_to_improve,
    ...summary.suggested_actions,
  ];
}

Given(
  'the model will answer that {person} {string}',
  (_name: string, point: string) => {
    // Built from the question rather than fixed, because a point has to cite a message that was
    // actually sent — the use case rejects an answer naming one that was not.
    harness().aiCompleter.answeringWith((asked) => ({
      language: 'en',
      themes: [{ point, sources: idsGiven(asked.prompt).slice(0, 1) }],
      strengths: [],
      areas_to_improve: [],
      suggested_actions: [],
    }));
  },
);

/** The ids the corpus carried, which is how a point cites the message it came from. */
function idsGiven(prompt: string): string[] {
  return [...prompt.matchAll(/id="([^"]+)"/g)].map((found) => found[1] ?? '');
}

/**
 * Drains the request that writing Feedback enqueued, which is what writes the summary. The
 * scenario drives the relay by hand, because its poller is stopped for these runs (ADR 0076 D13).
 */
When("{person}'s summary is written", async (_name: string) => {
  await drainOutbox();
});

Given("{person}'s summary has been written", async (_name: string) => {
  await drainOutbox();
});

When(
  '{person} reads their summary',
  async function (this: ThriveWorld, name: string) {
    this.succeeded(
      await this.as(
        name,
        'GET',
        `/v1/workspaces/${this.workspaceOf(name)}/me/summary`,
      ),
      `${name} reading their summary`,
    );
  },
);

Then(
  "{person}'s summary says {string}",
  function (this: ThriveWorld, _name: string, point: string) {
    assert.ok(
      everyPoint(summaryRead(this)).some((written) =>
        written.point.includes(point),
      ),
      `The summary does not say "${point}".`,
    );
  },
);

Then(
  "{person}'s summary says it was written from {int} messages",
  function (this: ThriveWorld, _name: string, count: number) {
    assert.equal(summaryRead(this).sourceCount, count);
  },
);

Then(
  "{person}'s summary is current",
  function (this: ThriveWorld, _name: string) {
    assert.equal(summaryRead(this).isStale, false);
  },
);

Then(
  "{person}'s summary is behind",
  function (this: ThriveWorld, _name: string) {
    assert.equal(summaryRead(this).isStale, true);
  },
);

Then(
  'every point in the summary names the message it came from',
  function (this: ThriveWorld) {
    for (const written of everyPoint(summaryRead(this))) {
      assert.ok(
        written.sources.length > 0,
        `"${written.point}" cites nothing.`,
      );
    }
  },
);

Then(
  '{person} has no summary yet',
  function (this: ThriveWorld, _name: string) {
    assert.equal(this.lastResponse?.body?.summary, null);
  },
);

Then('the model was never asked', () => {
  assert.equal(harness().aiCompleter.asked.length, 0);
});

Then('the model was given {int} messages', (count: number) => {
  const asked = harness().aiCompleter.asked[0];
  assert.ok(asked, 'The model was never asked.');
  assert.equal([...asked.prompt.matchAll(/<msg /g)].length, count);
});
