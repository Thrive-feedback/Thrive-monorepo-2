/**
 * The `@api` scenarios run here, over HTTP against the application. The feature files are
 * shared by every stack and live at the repository root; these step definitions belong to
 * this app and live with it.
 */
module.exports = {
  default: {
    requireModule: ['ts-node/register', 'tsconfig-paths/register'],
    require: ['test/steps/**/*.ts'],
    paths: ['../../features/**/*.feature'],
    tags: '@api',
    format: ['summary'],
  },
};
