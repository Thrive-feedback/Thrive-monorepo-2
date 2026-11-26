import { describe, expect, it } from 'bun:test';
import {
  OneOnOneTemplateInvalidError,
  OneOnOneTemplateLimitReachedError,
  OneOnOneTemplateNameTakenError,
  OneOnOneTemplateNotYoursError,
} from '../one-on-one-template.errors';
import {
  MAX_TEMPLATE_QUESTIONS,
  OneOnOneTemplateContent,
} from '../value-object/one-on-one-template-content.vo';
import {
  MAX_TEMPLATES_PER_LAYER,
  OneOnOneTemplate,
  type OneOnOneTemplateScope,
} from './one-on-one-template.entity';

const WORKSPACE_ID = 'workspace-1';
const KRIT = 'account-krit';
const MINT = 'account-mint';
const NOW = new Date('2026-11-26T03:00:00.000Z');

function content(name = 'Sprint retro', questions = ['What slowed us?']) {
  return OneOnOneTemplateContent.of({ name, questions });
}

function kept(
  id: string,
  scope: OneOnOneTemplateScope = 'PERSONAL',
  name = 'Sprint retro',
  by = { accountId: KRIT, isAdmin: true },
) {
  return OneOnOneTemplate.keep({
    id,
    workspaceId: WORKSPACE_ID,
    scope,
    by,
    content: content(name),
  });
}

describe('OneOnOneTemplateContent', () => {
  it('keeps what was written, trimmed, with nothing said about when to use it as empty', () => {
    const written = OneOnOneTemplateContent.of({
      name: '  Sprint retro ',
      questions: [' What slowed us? ', 'What helped?'],
    }).snapshot();

    expect(written).toEqual({
      name: 'Sprint retro',
      suggestedWhen: '',
      questions: ['What slowed us?', 'What helped?'],
    });
  });

  it.each([
    ['no name', { name: ' ', questions: ['Q?'] }],
    ['a name too long', { name: 'n'.repeat(61), questions: ['Q?'] }],
    [
      'when to use it too long',
      { name: 'N', suggestedWhen: 'w'.repeat(121), questions: ['Q?'] },
    ],
    ['no question', { name: 'N', questions: [] }],
    [
      'too many questions',
      {
        name: 'N',
        questions: Array.from(
          { length: MAX_TEMPLATE_QUESTIONS + 1 },
          (_, i) => `Q${i}?`,
        ),
      },
    ],
    ['an empty question', { name: 'N', questions: ['Q?', '  '] }],
    ['a question too long', { name: 'N', questions: ['q'.repeat(201)] }],
    [
      'a question asked twice, in another case and spacing',
      { name: 'N', questions: ['What helped?', 'what  helped?'] },
    ],
  ])('refuses %s', (_, input) => {
    expect(() => OneOnOneTemplateContent.of(input)).toThrow(
      OneOnOneTemplateInvalidError,
    );
  });
});

describe('OneOnOneTemplate', () => {
  it("is one Member's own, seen and changed by them alone", () => {
    const own = kept('t-1', 'PERSONAL', 'Mine', {
      accountId: KRIT,
      isAdmin: false,
    });

    expect(own.snapshot().ownerAccountId).toBe(KRIT);
    expect(own.isSeenBy(KRIT)).toBe(true);
    expect(own.isSeenBy(MINT)).toBe(false);
    expect(own.isChangeableBy({ accountId: MINT, isAdmin: true })).toBe(false);
  });

  it("is the Workspace's for everyone, kept and changed only by an Admin", () => {
    expect(() =>
      kept('t-1', 'WORKSPACE', 'Ours', { accountId: MINT, isAdmin: false }),
    ).toThrow(OneOnOneTemplateNotYoursError);

    const ours = kept('t-1', 'WORKSPACE');
    expect(ours.snapshot().ownerAccountId).toBeNull();
    expect(ours.isSeenBy(MINT)).toBe(true);
    expect(() =>
      ours.rewrite({ accountId: MINT, isAdmin: false }, content('Renamed')),
    ).toThrow(OneOnOneTemplateNotYoursError);

    ours.rewrite({ accountId: MINT, isAdmin: true }, content('Renamed'));
    expect(ours.snapshot().name).toBe('Renamed');
  });

  it('once removed, is chosen by nobody, though it is still seen for the 1:1s starting from it', () => {
    const own = kept('t-1');

    own.remove({ accountId: KRIT, isAdmin: false }, NOW);

    expect(own.isRemoved()).toBe(true);
    expect(own.isChoosableBy(KRIT)).toBe(false);
    expect(own.snapshot().removedAt).toEqual(NOW);
    expect(own.snapshot().questions).toEqual(['What slowed us?']);
  });

  it('refuses a name its layer already keeps, in any letter case, but not its own', () => {
    const first = kept('t-1', 'PERSONAL', 'Sprint retro');
    const second = kept('t-2', 'PERSONAL', 'SPRINT  retro');

    expect(() => OneOnOneTemplate.assertFitsBeside(second, [first])).toThrow(
      OneOnOneTemplateNameTakenError,
    );
    expect(() =>
      OneOnOneTemplate.assertFitsBeside(first, [first]),
    ).not.toThrow();
  });

  it('refuses one template more than a layer keeps', () => {
    const full = Array.from({ length: MAX_TEMPLATES_PER_LAYER }, (_, i) =>
      kept(`t-${i}`, 'PERSONAL', `Template ${i}`),
    );

    expect(() =>
      OneOnOneTemplate.assertFitsBeside(kept('t-new', 'PERSONAL', 'New'), full),
    ).toThrow(OneOnOneTemplateLimitReachedError);
  });
});
