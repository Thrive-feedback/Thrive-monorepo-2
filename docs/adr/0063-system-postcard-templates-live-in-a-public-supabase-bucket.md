# 0063 — System postcard templates live in a public Supabase bucket

Status:   accepted
Date:     2026-10-30
Deciders: kritpavin

## Context

The postcard's front showed one drawn landscape, and its Templates tool was a placeholder. Design
has drawn pictures for the front and wants a writer to choose one. The pictures are files, and
Thrive had nowhere to keep a file: object storage was planned with no provider chosen
(`PROJECT.md` §4), and ADR 0043 had kept photos as Google's links so that none was needed.

Design has already put the first four in Supabase Storage, in the same project as the database
(ADR 0020, `rygqsihgowwdtakedrxl`), in the bucket `postcard_template`, folder `system/`. These are Thrive's own
pictures, the same for every Workspace. None is uploaded by a person.

The browser talks only to the web origin (ADR 0027).

## Decision

**System postcard templates are files in the public Supabase Storage bucket `postcard_template`,
under `system/`, read only through `next/image` on the web origin. A catalog in the web app
chooses which are shown.**

- The bucket is **public**, so a file is read at
  `https://rygqsihgowwdtakedrxl.supabase.co/storage/v1/object/public/postcard_template/system/<file>`
  with no credential. **Neither Supabase's S3 access keys nor its service key are used
  anywhere.** S3 keys give full access to every bucket and bypass RLS, which is far more than
  reading public pictures needs.
- The browser never fetches Supabase. `next/image` fetches the file on the web server, resizes
  and caches it, and serves it from `/_next/image`. `images.remotePatterns` in
  `apps/web/next.config.ts` allows exactly that host and path, both taken from
  `apps/web/lib/postcard-storage.util.ts`.
- **The host is the variable `NEXT_PUBLIC_POSTCARD_STORAGE_HOST`**, the project's host name
  alone (`rygqsihgowwdtakedrxl.supabase.co`). The path is code: it is the bucket's layout, the
  same in every project. The variable is public because the catalog builds each picture's address
  in the browser. That gives nothing away: the bucket is public, and the host already shows in
  every `/_next/image?url=…`. Next writes it into the build, so it is a build argument of the web
  image, set in `deploy.yml` beside `API_BASE_URL`, and the build stops, naming it, when it is
  missing or is not a bare host.
- The catalog, `POSTCARD_TEMPLATES` in
  `apps/web/components/organisms/postcard-dialog/postcard-template.constant.ts`, lists each
  template's key, file and alt text, in the order they are offered. A file in the bucket that the
  catalog does not list is not shown. Adding a template is a file upload plus a change to the
  catalog, and it ships with a deploy.
- A template's **key** is `system/` and its file's name without the extension
  (`system/postcard_template_1`). It is what
  a saved card will name, so a key is never reused for another picture.
- **A template is retired by taking it out of the catalog, never by deleting its file.** Cards
  saved with it still need the picture.
- A template is a **4:3 landscape, at least 1500×1125**, JPG or WebP, as the first four are. The
  front crops it to fill, centred, and its frame is not 4:3 on any screen: from `md` it is about
  3:2 (roughly 6% lost at the top and at the bottom), and on a phone it is nearly square,
  because the card keeps its height for the message on the back (roughly 15% lost at each
  side). What matters in a picture stays in its middle 60% across.
  4:3 was chosen over 3:2 because it loses less on a phone and only a little more from `md`.

This decides storage for system templates only. Where a person's own uploads go (Epic #10) stays
open.

## Consequences

- Object storage exists, for this one use. `PROJECT.md` records it.
- The host is written into the build, not read at run time. Moving the files to another
  Supabase project means changing the variable in `deploy.yml` and rebuilding; setting it on
  Railway does nothing. Another provider would also change the path, and is a code change.
- `apps/web/lib/postcard-storage.util.ts` reads the environment and is in the browser's code,
  through the catalogs. That is the one deliberate exception to `FE_08` R5 ("keep anything that
  reads the environment out of the client graph"): the value is a `NEXT_PUBLIC_` one, written
  into the build, public by nature, and checked by the build before it is used. A secret, or a
  value read at run time, still never goes there.
- The web image now carries two addresses from its build, `API_BASE_URL` and this host, and
  `turbo.json`, `pr.yml` and the test setup each give it a value.
- The front needs the network. Locally that means the internet: compose has no storage. A
  picture that fails to load leaves plain paper with its description, and the card can still be
  sent.
- Pictures do not follow the theme, as the drawn landscape did. A dark-mode variant would be a
  second file per template.
- Image resizing runs on `thrive-web`, and its cache is the container's disk, lost on each
  deploy. That is a cold fetch per size after a deploy, which is acceptable for a few pictures.
- The first four templates' files are named `postcard_template_N.jpg`. That name says nothing
  about the picture, so the alt text in the catalog is the only description of it.

## Alternatives rejected

- **Commit the pictures to `apps/web/public`.** This needs no provider and no network. But Design
  keeps the files in Supabase, every new picture would be a binary in git, and user uploads will
  need a store anyway.
- **A private bucket with signed URLs.** Nothing here is private, and it would need a server
  key, an API adapter and an endpoint. A saved card would hold an address that expires.
- **The browser loads the files from `supabase.co` directly.** This is simpler, but it breaks ADR
  0027's single origin and sends full-size originals to phones.
- **List the bucket at runtime, so an upload is live without a deploy.** That needs a key on the
  server to list objects, and nothing would review alt text or order before a picture appears.

## Links

- ADR 0020 (database host), ADR 0027 (one origin for the browser), ADR 0043 (photos are
  Google's links)
- Supabase, "S3 Authentication": access keys are for the server only and bypass RLS
- `FE_06` R7 (every image has an intentional alternative)
