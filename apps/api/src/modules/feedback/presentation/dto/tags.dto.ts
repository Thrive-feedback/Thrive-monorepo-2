import { z } from 'zod';

/**
 * What some sent text was bound to when it was sent: the Workspace Goals its hashtags named, in
 * the Admin's spelling, and the Members its slugs named, by the name they went by. A reader
 * highlights exactly these; every other `#` or `@` in the text is plain.
 */
export const tagsSchema = z.object({
  workspaceGoals: z.array(z.object({ name: z.string() })),
  mentions: z.array(z.object({ slug: z.string(), displayName: z.string() })),
});
