import { describe, expect, it } from 'bun:test';
import {
  FakeOneOnOneTemplateQuery,
  FakeOneOnOneTemplateRepository,
} from '@test/support/one-on-one.fakes';
import { OneOnOneTemplate } from '../../domain/entity/one-on-one-template.entity';
import { OneOnOneTemplateContent } from '../../domain/value-object/one-on-one-template-content.vo';
import { OneOnOneTemplateNamesService } from './one-on-one-template-names.service';

const WORKSPACE_ID = 'workspace-acme';
const KRIT = 'account-krit';
const RETRO = '0199b6a0-0000-7000-8000-100000000001';
const CAREER = '0199b6a0-0000-7000-8000-100000000002';

function kept(id: string, name: string): OneOnOneTemplate {
  return OneOnOneTemplate.keep({
    id,
    workspaceId: WORKSPACE_ID,
    scope: 'PERSONAL',
    by: { accountId: KRIT, isAdmin: false },
    content: OneOnOneTemplateContent.of({ name, questions: ['Q?'] }),
  });
}

describe('the names of the templates an agenda uses', () => {
  it("names Thrive's and kept ones in the order given, reading the kept ones once", async () => {
    const templates = new FakeOneOnOneTemplateRepository().with(
      kept(RETRO, 'Sprint retro'),
      kept(CAREER, 'Career chat'),
    );
    const query = new FakeOneOnOneTemplateQuery(templates);
    const names = new OneOnOneTemplateNamesService(query);

    const named = await names.namesOf(WORKSPACE_ID, [
      CAREER,
      'weekly-check-in',
      RETRO,
    ]);

    expect(named).toEqual([
      { key: CAREER, name: 'Career chat' },
      { key: 'weekly-check-in', name: 'Weekly check-in' },
      { key: RETRO, name: 'Sprint retro' },
    ]);
    expect(query.nameReads).toBe(1);
  });

  it('says so loudly when a kept one named is not kept in the Workspace', async () => {
    const names = new OneOnOneTemplateNamesService(
      new FakeOneOnOneTemplateQuery(new FakeOneOnOneTemplateRepository()),
    );

    await expect(names.namesOf(WORKSPACE_ID, [RETRO])).rejects.toThrow(
      /does not keep it/,
    );
  });
});
