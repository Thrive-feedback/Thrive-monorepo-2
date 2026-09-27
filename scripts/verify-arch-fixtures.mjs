#!/usr/bin/env node
/**
 * Proves the architecture guardrails actually fire.
 *
 * `INFRA_06` R8: a new guardrail lands with the rule it enforces, an example that fails it,
 * and the fixes it demands — "so the check is proven to work rather than assumed". This
 * script is that proof, and it is mechanical: every rule in `.dependency-cruiser.cjs` must
 * have a fixture directory named after it, and cruising that directory must report that rule.
 * A rule added without a fixture fails here, which is the only way the requirement stays true
 * after today.
 *
 * Each fixture is a miniature repository — `apps/…`, `packages/…` — cruised with its own
 * directory as the working directory, so its paths match rules anchored at `^apps/` and
 * `^packages/` without putting deliberately broken files in the real tree.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const FIXTURES = resolve(ROOT, 'scripts/arch-fixtures');
const CONFIG = resolve(ROOT, '.dependency-cruiser.cjs');
const CRUISER = resolve(ROOT, 'node_modules/.bin/depcruise');

// The config is CommonJS, so its `module.exports` arrives as the default export.
const { forbidden } = (await import(CONFIG)).default;
const ruleNames = forbidden.map((rule) => rule.name);
const cases = readdirSync(FIXTURES, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const failures = [];

for (const rule of ruleNames) {
  if (!cases.includes(rule)) {
    failures.push(
      `${rule}: no fixture. INFRA_06 R8 — a guardrail ships with an example that fails it.`,
    );
  }
}
for (const name of cases) {
  if (!ruleNames.includes(name)) {
    failures.push(
      `${name}: fixture for a rule that no longer exists. Delete it or restore the rule.`,
    );
  }
}

/** Cruise one fixture from inside its own directory and return the rules it reported. */
function reportedRules(name) {
  const cwd = resolve(FIXTURES, name);
  // A fixture only contains the trees its rule needs, and depcruise refuses a path that
  // does not exist rather than ignoring it.
  const roots = ['apps', 'packages'].filter((dir) =>
    existsSync(resolve(cwd, dir)),
  );
  let stdout;
  try {
    stdout = execFileSync(
      process.execPath,
      [CRUISER, ...roots, '--config', CONFIG, '--output-type', 'json'],
      { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
  } catch (error) {
    // depcruise exits non-zero precisely because the fixture violates something.
    stdout = error.stdout;
  }
  const { summary } = JSON.parse(stdout);
  return new Set(summary.violations.map((violation) => violation.rule.name));
}

for (const name of cases.filter((candidate) => ruleNames.includes(candidate))) {
  const reported = reportedRules(name);
  if (!reported.has(name)) {
    failures.push(
      `${name}: the fixture did not trip its own rule. Reported instead: ${
        [...reported].join(', ') || 'nothing'
      }.`,
    );
  }
}

if (failures.length > 0) {
  console.error('Architecture fixtures failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error(
    `\n${failures.length} problem(s). Every rule needs an example that fails it.`,
  );
  process.exit(1);
}

console.log(
  `Architecture fixtures passed: ${ruleNames.length} rules, each proven by its own failing example.`,
);
