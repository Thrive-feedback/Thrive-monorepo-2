/**
 * How one kind of tag is written: the character that starts it, what may follow in a finished
 * tag, and what may follow while it is still being typed — which can be looser, so a search can
 * run on a name before it is a slug.
 */
export type TagRule = {
  readonly char: string;
  /** The whole of a finished tag after `char`. */
  readonly body: RegExp;
  /** One character of what is typed after `char` while picking. */
  readonly typing: RegExp;
};

/** A run of text, or one tag in it, in the order written. Joined, the `text`s give the input back. */
export type TextSegment =
  | { readonly kind: 'text'; readonly text: string }
  | {
      readonly kind: 'tag';
      readonly char: string;
      /** As written, `char` included. */
      readonly text: string;
      /** What it is matched by: after `char`, composed and lower-cased. */
      readonly key: string;
    };

/** The tag being typed just before the caret: where its `char` sits and what follows it. */
export type TypedTrigger = {
  readonly char: string;
  readonly query: string;
  /** The index of `char` in the text. */
  readonly start: number;
};

/** The key a tag's body is matched by, however its letters were typed or cased. */
export function tagKeyOf(body: string): string {
  return body.normalize('NFC').toLowerCase();
}

function stickyOf(pattern: RegExp): RegExp {
  return new RegExp(pattern.source, `${pattern.flags.replace(/[gy]/gu, '')}y`);
}

/**
 * Splits text into plain runs and tags. A tag counts wherever its `char` is written — Thai is
 * written without spaces, so `ดีมาก#ownership` holds one — and never changes the text, so a
 * highlight drawn over a field lines up with what is typed in it.
 */
export function segmentsOf(
  text: string,
  rules: readonly TagRule[],
): TextSegment[] {
  const bodies = new Map(rules.map((rule) => [rule.char, stickyOf(rule.body)]));
  const segments: TextSegment[] = [];
  let plainFrom = 0;
  let index = 0;
  while (index < text.length) {
    const char = text.charAt(index);
    const body = bodies.get(char);
    if (body) {
      body.lastIndex = index + 1;
      const match = body.exec(text);
      if (match) {
        if (plainFrom < index) {
          segments.push({ kind: 'text', text: text.slice(plainFrom, index) });
        }
        const end = index + 1 + match[0].length;
        segments.push({
          kind: 'tag',
          char,
          text: text.slice(index, end),
          key: tagKeyOf(match[0]),
        });
        index = end;
        plainFrom = end;
        continue;
      }
    }
    index += 1;
  }
  if (plainFrom < text.length) {
    segments.push({ kind: 'text', text: text.slice(plainFrom) });
  }
  return segments;
}

/**
 * The tag being typed when the caret is at `caret`, or `null`. Of the rules, the `char` closest
 * before the caret wins, provided everything between it and the caret may be typed after it.
 */
export function typedTriggerAt(
  text: string,
  caret: number,
  rules: readonly TagRule[],
): TypedTrigger | null {
  const before = text.slice(0, caret);
  let found: TypedTrigger | null = null;
  for (const rule of rules) {
    const start = before.lastIndexOf(rule.char);
    if (start === -1 || (found !== null && found.start > start)) {
      continue;
    }
    const query = before.slice(start + 1);
    if (wholly(rule.typing).test(query)) {
      found = { char: rule.char, query, start };
    }
  }
  return found;
}

/** Matches text made of nothing but `letter`, any number of times. */
function wholly(letter: RegExp): RegExp {
  return new RegExp(
    `^(?:${letter.source})*$`,
    letter.flags.replace(/[gy]/gu, ''),
  );
}
