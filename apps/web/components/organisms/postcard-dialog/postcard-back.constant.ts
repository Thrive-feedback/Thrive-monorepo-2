import type { PostcardKind } from './postcard-draft.type';

/**
 * Keeps the address, and so the message under it, clear of the stamp's square in the top-right
 * corner: the line is tall enough to bring the message below it, and stops short of it where they
 * share a row. A request's corner is on the other half from `md`, so its address needs neither
 * there.
 */
export const STAMP_CLEARANCE: Readonly<
  Record<Exclude<PostcardKind, 'answer'>, string>
> = {
  give: 'min-h-18.5 content-start pe-21 md:min-h-16.5 md:pe-18',
  ask: 'min-h-18.5 content-start pe-21 md:min-h-0 md:pe-0',
};

/** The one full back of given Feedback: the address, then the message under it. */
export const FULL_BACK =
  'flex min-h-0 flex-1 flex-col gap-4 px-5 pt-5 pb-5 md:px-8 md:pt-7 md:pb-7';
