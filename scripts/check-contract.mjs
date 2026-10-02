#!/usr/bin/env node
/**
 * Proves the committed contract still matches the API app that owns it.
 *
 * `GEN_08` R2–R4: the API app defines the contract, OpenAPI is generated from it, the
 * client is generated from OpenAPI, and both generated files are committed so a checkout
 * type-checks without running the API. ADR 0006 accepted one gap when it made that choice —
 * "nothing yet fails the build when the committed output is stale" — and named the fix:
 * regenerate, then fail on a non-empty diff. This is that check.
 *
 * Without it a route rename lands with a stale client, and the first person to notice is
 * whoever hits a type error in a screen days later. Regenerating costs no database and no
 * server: the document comes from route metadata alone.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

/** Both halves of the generated contract: the document, and the client built from it. */
const GENERATED = [
  'apps/api/openapi.json',
  'packages/api/src/generated/schema.ts',
];

function run(command, args) {
  return spawnSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    encoding: 'utf8',
  });
}

const generated = run('turbo', [
  'run',
  'contract:generate',
  '--filter=api',
  '--output-logs=errors-only',
]);

if (generated.status !== 0) {
  console.error(
    '\nThe contract could not be generated, so drift cannot be judged.',
  );
  process.exit(generated.status ?? 1);
}

const diff = spawnSync('git', ['diff', '--name-only', '--', ...GENERATED], {
  cwd: ROOT,
  encoding: 'utf8',
});
const drifted = diff.stdout.trim().split('\n').filter(Boolean);

if (drifted.length === 0) {
  console.log('The committed contract matches the API app.');
  process.exit(0);
}

console.error(
  `\nThe committed contract is stale. Regenerating changed ${drifted.length === 1 ? 'this file' : 'these files'}:\n`,
);
for (const file of drifted) console.error(`  ${file}`);
console.error(
  '\nThe API app changed without its contract being regenerated, so the client the web app\n' +
    'imports no longer describes this API. Run `turbo run contract:generate --filter=api`\n' +
    'and commit both files — a contract change ships before the change that consumes it.\n',
);

// The diff itself, so the failure names what drifted rather than only that something did.
execFileSync('git', ['--no-pager', 'diff', '--', ...GENERATED], {
  cwd: ROOT,
  stdio: 'inherit',
});

process.exit(1);
