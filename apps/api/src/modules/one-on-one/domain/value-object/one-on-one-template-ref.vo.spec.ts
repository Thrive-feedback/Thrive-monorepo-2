import { describe, expect, it } from 'bun:test';
import { OneOnOneTemplateUnknownError } from '../one-on-one.errors';
import {
  storedTemplateRef,
  templateColumnsOf,
  templateKeyOf,
  templateRefOf,
} from './one-on-one-template-ref.vo';
import { ThriveTemplate } from './thrive-template.vo';

const KEPT_ID = '0199b6a0-0000-7000-8000-000000000002';

describe('templateRefOf', () => {
  it("reads one of Thrive's keys as Thrive's, and a UUID as a kept template's id", () => {
    expect(templateRefOf('weekly-check-in')).toEqual({
      kind: 'THRIVE',
      key: 'weekly-check-in',
    });
    expect(templateRefOf(KEPT_ID)).toEqual({ kind: 'KEPT', id: KEPT_ID });
  });

  it('never mistakes one of Thrive’s keys for a kept id, as none is shaped like a UUID', () => {
    for (const template of ThriveTemplate.all()) {
      expect(templateRefOf(template.snapshot().key).kind).toBe('THRIVE');
    }
  });

  it('refuses what is neither', () => {
    expect(() => templateRefOf('my-template')).toThrow(
      OneOnOneTemplateUnknownError,
    );
  });
});

describe('a stored reference', () => {
  it('goes to its own column and back, and travels as one key', () => {
    const kept = templateRefOf(KEPT_ID);

    expect(templateColumnsOf(kept)).toEqual({
      templateKey: null,
      templateId: KEPT_ID,
    });
    expect(storedTemplateRef(templateColumnsOf(kept))).toEqual(kept);
    expect(templateKeyOf(storedTemplateRef(templateColumnsOf(kept)))).toBe(
      KEPT_ID,
    );
  });

  it('says loudly when a row names both, neither, or a key Thrive does not have', () => {
    expect(() =>
      storedTemplateRef({
        templateKey: 'weekly-check-in',
        templateId: KEPT_ID,
      }),
    ).toThrow();
    expect(() =>
      storedTemplateRef({ templateKey: null, templateId: null }),
    ).toThrow();
    // A key Thrive does not have, such as a kept id in the wrong column, is broken too.
    expect(() =>
      storedTemplateRef({ templateKey: KEPT_ID, templateId: null }),
    ).toThrow(/a key Thrive does not have/);
  });
});
