#!/usr/bin/env node
/**
 * Architecture checks for the web app.
 *
 * INFRA_06 — where the web app calls the API is decided by method (ADR 0032): a read renders
 * on the server, a write is a server action, and the browser never calls the API. The import
 * graph cannot see `'use client'` or `'use server'`, so these rules read the source instead.
 * Run with `bun run check-arch`.
 *
 * What stays with review: a read for display or a write during render that goes through a
 * helper rather than calling the client directly. An action may still read the session to
 * authorize its own write, because it does so through the session service, not `.GET(`.
 */
import { globSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const files = globSync('{app,lib,components}/**/*.{ts,tsx}', {
  cwd: ROOT,
}).filter((f) => !/\.test\.tsx?$/.test(f) && !f.startsWith('lib/test/'));

const findings = [];
const report = (rule, file, detail) => findings.push({ rule, file, detail });

/** The directive a module opens with, if any, once leading comments are skipped. */
function directiveOf(source) {
  const body = source.replace(/^(\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*/, '');
  const m = body.match(/^['"]use (client|server)['"]/);
  return m ? m[1] : null;
}

/**
 * Whether a module imports a runtime value from the API package. A type-only import is
 * erased before the bundle is built, so it carries nothing to the browser.
 */
function importsApiValue(source) {
  for (const m of source.matchAll(
    /import\s+([^;]*?)\s+from\s+['"]@repo\/api['"]/g,
  )) {
    const clause = m[1].trim();
    if (clause.startsWith('type ')) continue;
    const named = clause.match(/^\{([^}]*)\}$/);
    const allTypes = named?.[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .every((s) => s.startsWith('type '));
    if (!allTypes) return true;
  }
  return false;
}

for (const file of files) {
  const source = readFileSync(resolve(ROOT, file), 'utf8');
  const directive = directiveOf(source);

  // FE_09 R4 — the browser sends no request to the API, not even a raw one.
  if (directive === 'client' && /\bfetch\s*\(/.test(source)) {
    report('FE_09 R4', file, 'a client module calls fetch()');
  }

  // FE_08 R5 — the API client and its runtime stay out of the client graph.
  if (directive === 'client' && importsApiValue(source)) {
    report('FE_08 R5', file, 'a client module imports a value from @repo/api');
  }

  // FE_09 R1 — an action is an uncached POST, so it fetches nothing for display.
  if (directive === 'server' && /\.GET\s*\(/.test(source)) {
    report('FE_09 R1', file, 'a server action calls .GET()');
  }

  // FE_09 R4 — a write happens in an action, never during render.
  const write = source.match(/\.(POST|PUT|PATCH|DELETE)\s*\(/);
  if (directive !== 'server' && write) {
    report('FE_09 R4', file, `calls .${write[1]}() outside a server action`);
  }
}

if (findings.length === 0) {
  console.log('Architecture checks passed.');
  process.exit(0);
}

console.error(`${findings.length} architecture violation(s):\n`);
for (const { rule, file, detail } of findings) {
  console.error(`  ${rule.padEnd(10)} ${file}\n             ${detail}`);
}
process.exit(1);
