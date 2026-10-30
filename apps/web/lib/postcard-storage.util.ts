/**
 * Where the postcard's pictures are: Supabase Storage's public buckets, one for the templates on
 * the front (ADR 0063), one for the stamps (ADR 0064) and one for the stickers (ADR 0068), in the same project. Shared by the
 * build, which lets `next/image` fetch from exactly here, and by the catalogs, which name each
 * file under it, so the two can never disagree.
 *
 * The host is the Supabase project's, from `NEXT_PUBLIC_POSTCARD_STORAGE_HOST`. It is public
 * because the catalogs are read in the browser, and it is no secret: anyone may read these files.
 * Next writes it into the build, so the build reads it here first and a missing or malformed
 * value stops the build, naming the variable, rather than shipping pictures that go nowhere.
 */
export function postcardStorageHost(): string {
  // Read whole, by its own name: Next only writes a public variable in where it is spelled out.
  const host = process.env.NEXT_PUBLIC_POSTCARD_STORAGE_HOST;
  if (!host) {
    throw new Error(
      'NEXT_PUBLIC_POSTCARD_STORAGE_HOST is not set. Copy apps/web/.env.example to apps/web/.env.',
    );
  }
  if (host.includes('/')) {
    throw new Error(
      `NEXT_PUBLIC_POSTCARD_STORAGE_HOST must be a host name alone, without https:// or a path; it is "${host}".`,
    );
  }
  return host;
}

/** The folder of Thrive's own templates, the same for every Workspace and in every project. */
export const POSTCARD_TEMPLATE_PATH =
  '/storage/v1/object/public/postcard_template/system/';

/** The folder of Thrive's own stamps, the same for every Workspace and in every project. */
export const POSTCARD_STAMP_PATH =
  '/storage/v1/object/public/postcard_stamp/system/';

/** The folder of Thrive's own stickers, the same for every Workspace and in every project. */
export const POSTCARD_STICKER_PATH =
  '/storage/v1/object/public/postcard_sticker/system/';

/** One of Thrive's own pictures: where it is, the key a saved card names it by, and what it shows. */
export type StoredPicture = {
  /** `system/` and the file's name without its extension. Saved cards will name it, so a key is never reused for another picture. */
  readonly key: string;
  readonly src: string;
  /** What the picture shows, said in its place: the file's name says nothing about it. */
  readonly alt: string;
};

/**
 * A picture in one of the folders above, as the catalogs list it. The one place the key is made,
 * so templates, stamps and stickers can never name their pictures two different ways.
 */
export function storedPicture(
  path: string,
  file: string,
  alt: string,
): StoredPicture {
  return {
    key: `system/${file.replace(/\.[a-z]+$/, '')}`,
    src: `https://${postcardStorageHost()}${path}${file}`,
    alt,
  };
}
