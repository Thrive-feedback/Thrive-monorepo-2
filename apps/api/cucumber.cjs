/**
 * The `@api` scenarios run here, over HTTP against the application. The feature files are
 * shared by every stack and live at the repository root; these step definitions belong to
 * this app and live with it.
 *
 * Run under Bun (`test:bdd`), the runtime the API ships on: Bun loads the TypeScript, the
 * decorator metadata and the `@app/*` paths from `tsconfig.json` itself, and the Prisma client
 * is generated for it.
 */
module.exports = {
  default: {
    require: ['test/support/**/*.ts', 'test/steps/**/*.ts'],
    paths: ['../../features/**/*.feature'],
    tags: '@api',
    format: ['progress'],
    // Surfaces a scenario that only passes because another ran first.
    order: 'random',
  },
};
