import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { z } from 'zod';
import { SITE_NAME } from '@/lib/site.constant';
import { LANDING_COPY } from './_components/landing/landing-copy.constant';

const { title, description } = LANDING_COPY.meta;

export const alt = title;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/*
 * Drawn once, at build time. An image has no stylesheet, so no token reaches it: its two colours
 * are the brand's as the web app manifest already declares them for the browser, and its mark is
 * the site's own icon, so the preview can never drift from either.
 */
const appDirectory = join(process.cwd(), 'app');
const BrandColours = z.object({
  theme_color: z.string(),
  background_color: z.string(),
});
const manifest = readFile(
  join(appDirectory, 'manifest.webmanifest'),
  'utf8',
).then((text) => BrandColours.parse(JSON.parse(text)));
const icon = readFile(join(appDirectory, 'icon.svg'), 'base64');

/**
 * The preview a link to the site unfurls into: the mark, the page's title and its description,
 * the same words as the page's metadata. Every route under this one shares it.
 */
export default async function OpengraphImage() {
  const [{ theme_color: ink, background_color: paper }, mark] =
    await Promise.all([manifest, icon]);
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 40,
        padding: 96,
        backgroundColor: paper,
        color: ink,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {/* biome-ignore lint/performance/noImgElement: an image drawn by ImageResponse, not a page; next/image does not apply. */}
        <img
          src={`data:image/svg+xml;base64,${mark}`}
          width={96}
          height={96}
          alt=""
        />
        <span style={{ fontSize: 56, fontWeight: 700 }}>{SITE_NAME}</span>
      </div>
      <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>
        {title}
      </div>
      <div style={{ fontSize: 32, lineHeight: 1.4, opacity: 0.85 }}>
        {description}
      </div>
    </div>,
    size,
  );
}
