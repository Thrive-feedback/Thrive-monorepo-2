/**
 * A hashtag: `#` then letters of any script with their marks — Thai vowels and tone marks are
 * marks — digits, `_` and `-`, which is everything a Workspace Goal's name may hold. It counts
 * wherever it is written, `ดีมาก#ownership` included, because Thai is written without spaces.
 */
const HASHTAG = /#([\p{L}\p{M}\p{N}_-]+)/gu;

/**
 * A Mention: `@` then a Profile's slug, which never starts or ends with a separator or holds
 * two together — so the full stop in `thanks @ann.lee.` ends the sentence, not the slug.
 */
const MENTION = /@([a-z0-9]+(?:[._-][a-z0-9]+)*)/giu;

/**
 * The hashtags and slugs written in some text, before anything is known about what they name.
 * Recognising them is the same rule the web app highlights by as it is typed, so what a writer
 * sees coloured is what is bound when they send it.
 */
export class WrittenTags {
  private constructor(
    private readonly writtenHashtags: readonly string[],
    private readonly writtenHandles: readonly string[],
  ) {}

  static in(...texts: readonly string[]): WrittenTags {
    const hashtags: string[] = [];
    const slugs: string[] = [];
    for (const text of texts) {
      const normalized = text.normalize('NFC');
      for (const [, name] of normalized.matchAll(HASHTAG)) {
        if (name !== undefined) hashtags.push(name);
      }
      for (const [, slug] of normalized.matchAll(MENTION)) {
        if (slug !== undefined) slugs.push(slug.toLowerCase());
      }
    }
    return new WrittenTags(hashtags, slugs);
  }

  /** Each name written after a `#`, once for every letter case it was written in. */
  hashtags(): string[] {
    const seen = new Set<string>();
    return this.writtenHashtags.filter((name) => {
      const key = name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /** Each slug written after an `@`, lower-cased as slugs are, once. */
  slugs(): string[] {
    return [...new Set(this.writtenHandles)];
  }
}
