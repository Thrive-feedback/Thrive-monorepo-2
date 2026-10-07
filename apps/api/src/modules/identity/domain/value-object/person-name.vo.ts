const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * A name as a person typed it, with surrounding and repeated whitespace collapsed. Its
 * length counts what a reader sees as one character, so a Thai vowel or tone mark does not
 * use up the limit the way a UTF-16 code unit count would.
 *
 * The shared core of {@link FullName} and {@link DisplayName}; each states its own limit
 * and its own errors.
 */
export class PersonName {
  private constructor(
    private readonly value: string,
    readonly length: number,
  ) {}

  static of(raw: string): PersonName {
    const normalized = raw.trim().replace(/\s+/gu, ' ');
    return new PersonName(
      normalized,
      [...graphemes.segment(normalized)].length,
    );
  }

  get isEmpty(): boolean {
    return this.length === 0;
  }

  toString(): string {
    return this.value;
  }
}
