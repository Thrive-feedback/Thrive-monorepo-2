import createNextIntlPlugin from 'next-intl/plugin';

/** Points `next-intl` at the file that picks the language and its messages for each request. */
const withNextIntl = createNextIntlPlugin('./lib/i18n/request.config.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['http://localhost:3000'],
};

export default withNextIntl(nextConfig);
