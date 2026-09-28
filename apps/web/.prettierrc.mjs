import config from '@repo/eslint-config/prettier-base';

/**
 * Class order carries no meaning, so it is the formatter's job. The plugin is registered
 * here rather than at the repository root because this is the only workspace that writes
 * utility classes.
 */
export default {
  ...config,
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindStylesheet: './app/globals.css',
};
