import { describe, expect, it } from 'bun:test';
import { z } from 'zod';
import {
  cursorQueryShape,
  positionCursorQueryShape,
  toCursor,
  toPositionCursor,
} from './page.dto';

const query = z.object(cursorQueryShape);
const positionQuery = z.object(positionCursorQueryShape);
const AN_ID = '0199a0f0-0000-7000-8000-0000000000a1';

describe('cursorQueryShape', () => {
  it('reads no cursor as the first page, at the usual size', () => {
    expect(query.parse({})).toEqual({ cursor: null, limit: 20 });
  });

  it('reads back the cursor it wrote', () => {
    expect(query.parse({ cursor: toCursor(AN_ID) }).cursor).toBe(AN_ID);
  });

  it('refuses a cursor that does not name a row', () => {
    expect(query.safeParse({ cursor: 'nonsense' }).success).toBe(false);
  });

  it('refuses a page larger than a list gives', () => {
    expect(query.safeParse({ limit: 101 }).success).toBe(false);
  });
});

describe('toCursor', () => {
  it('has nothing to name past the last page', () => {
    expect(toCursor(null)).toBeNull();
  });
});

describe('positionCursorQueryShape', () => {
  const place = { createdAt: new Date('2026-11-04T09:30:00.123Z'), id: AN_ID };

  it('reads no cursor as the first page, at the usual size', () => {
    expect(positionQuery.parse({})).toEqual({ cursor: null, limit: 20 });
  });

  it('reads back the place it wrote, to the millisecond', () => {
    expect(
      positionQuery.parse({ cursor: toPositionCursor(place) }).cursor,
    ).toEqual(place);
  });

  it('refuses a cursor that names only a row, as other lists write them', () => {
    expect(positionQuery.safeParse({ cursor: toCursor(AN_ID) }).success).toBe(
      false,
    );
  });

  it('has nothing to name past the last page', () => {
    expect(toPositionCursor(null)).toBeNull();
  });
});
