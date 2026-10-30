/**
 * Where the postcard templates' files are: Supabase Storage's public bucket (ADR 0063). Shared
 * by the build, which lets `next/image` fetch from exactly here, and by the catalog, which names
 * each file under it, so the two can never disagree.
 *
 * The host is the Supabase project's, from `NEXT_PUBLIC_POSTCARD_TEMPLATE_HOST`. It is public
 * because the catalog is read in the browser, and it is no secret: anyone may read these files.
 * Next writes it into the build, so the build reads it here first and a missing or malformed
 * value stops the build, naming the variable, rather than shipping pictures that go nowhere.
 */
export function postcardTemplateHost(): string {
  // Read whole, by its own name: Next only writes a public variable in where it is spelled out.
  const host = process.env.NEXT_PUBLIC_POSTCARD_TEMPLATE_HOST;
  if (!host) {
    throw new Error(
      'NEXT_PUBLIC_POSTCARD_TEMPLATE_HOST is not set. Copy apps/web/.env.example to apps/web/.env.',
    );
  }
  if (host.includes('/')) {
    throw new Error(
      `NEXT_PUBLIC_POSTCARD_TEMPLATE_HOST must be a host name alone, without https:// or a path; it is "${host}".`,
    );
  }
  return host;
}

/** The folder of Thrive's own templates, the same for every Workspace and in every project. */
export const POSTCARD_TEMPLATE_PATH =
  '/storage/v1/object/public/postcard_template/system/';
