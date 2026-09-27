/**
 * Graph-level architecture guardrails (`INFRA_06` R4: the import graph is the highest-value
 * target). Every rule names the document and rule it enforces, per `INFRA_06` R2, and every
 * rule has a fixture under `scripts/arch-fixtures/` that fails it, per R8.
 *
 * This tool owns what needs real module resolution: cycles, cross-workspace boundaries, and
 * imports that reach past a package's entry point. `apps/api/scripts/check-architecture.mjs`
 * keeps the specifier-level rules it already enforces (`BE_01`, `BE_02`, `BE_03`, `BE_09`).
 * ADR 0014 records the split.
 */
module.exports = {
  forbidden: [
    {
      name: 'no-cycles',
      comment:
        'INFRA_03 R1 — the workspace graph is acyclic. A cycle is a defect, never a ' +
        'configuration to work around.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-app-imports-app',
      comment:
        'INFRA_01 R6 and INFRA_03 R4 — no app imports another app. apps/web and apps/api ' +
        'meet only through packages/api.',
      severity: 'error',
      from: { path: '^apps/([^/]+)/' },
      to: { path: '^apps/(?!$1)[^/]+/' },
    },
    {
      name: 'no-package-imports-app',
      comment:
        'INFRA_01 R6 and INFRA_03 R4 — dependencies point toward the reusable end. ' +
        'Nothing in packages/ imports from apps/.',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    },
    {
      name: 'no-reaching-past-a-package-entry-point',
      comment:
        "INFRA_03 R3 and R5 — a package's export map is its API. Reach a package through " +
        'the map; never by file path. A specifier the map does not declare fails to ' +
        'resolve, which `not-unresolvable` reports, so this rule covers the other half: ' +
        'relative paths that walk into a package and bypass the map entirely.',
      severity: 'error',
      from: { pathNot: '^packages/' },
      to: { path: '^packages/[^/]+/src/', dependencyTypes: ['local'] },
    },
    {
      name: 'no-reaching-into-another-package',
      comment:
        'INFRA_03 R3 — same rule between two packages: through the entry point or not at ' +
        'all.',
      severity: 'error',
      from: { path: '^packages/([^/]+)/' },
      to: {
        path: '^packages/[^/]+/src/',
        pathNot: '^packages/$1/',
        dependencyTypes: ['local'],
      },
    },
    {
      name: 'not-unresolvable',
      comment:
        'INFRA_03 R5 — a specifier that does not resolve is either a typo or an import a ' +
        "package's export map deliberately refuses. Both fail the build rather than being " +
        'discovered at runtime.',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'fe-components-never-import-app',
      comment:
        'FE_01 R5 — imports run down the ladder only: route-private, then components/, ' +
        'then the shared UI package. components/ never imports from app/.',
      severity: 'error',
      from: { path: '^apps/web/components/' },
      to: { path: '^apps/web/app/' },
    },
    {
      name: 'fe-private-folder-is-private',
      comment:
        "FE_01 R5 — nothing outside a route reaches into that route's private folder. A " +
        'sideways import means the file belongs one rung up, so promote it.',
      severity: 'error',
      from: { path: '^apps/web/app/([^/]+)/' },
      to: {
        path: '^apps/web/app/[^/]+/_[^/]+/',
        pathNot: '^apps/web/app/$1/',
      },
    },
    {
      name: 'fe-private-folder-not-reachable-from-outside-app',
      comment:
        'FE_01 R5 — a route-private folder has one consumer, the route that owns it. ' +
        'Nothing in components/ or lib/ may import from one.',
      severity: 'error',
      from: { pathNot: '^apps/web/app/' },
      to: { path: '^apps/web/app/[^/]+/_[^/]+/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)scripts/arch-fixtures/' },
    // The fixtures under `scripts/arch-fixtures/` are cruised with their own directory as
    // the working directory, so their paths match the rules above. They have no tsconfig,
    // and naming one that does not exist is a fatal error rather than a skipped option.
    ...(require('node:fs').existsSync('tsconfig.json')
      ? { tsConfig: { fileName: 'tsconfig.json' } }
      : {}),
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.d.ts'],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
