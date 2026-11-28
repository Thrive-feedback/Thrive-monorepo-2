import { describe, expect, it } from 'bun:test';
import { FakeClock } from '@test/support/clock.fake';
import { FakeWorkspaceMembershipPort } from '@test/support/feedback.fakes';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import {
  FakeOneOnOneMeetingQuery,
  FakeOneOnOneMeetingRepository,
  FakeOneOnOneRepository,
  FakeOneOnOneTemplateQuery,
  FakeOneOnOneTemplateRepository,
} from '@test/support/one-on-one.fakes';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import { OneOnOne } from '../../../domain/entity/one-on-one.entity';
import {
  MAX_TEMPLATES_PER_LAYER,
  OneOnOneTemplate,
} from '../../../domain/entity/one-on-one-template.entity';
import { OneOnOneTemplateUnknownError } from '../../../domain/one-on-one.errors';
import {
  OneOnOneTemplateLimitReachedError,
  OneOnOneTemplateNameTakenError,
  OneOnOneTemplateNotYoursError,
} from '../../../domain/one-on-one-template.errors';
import { OneOnOneSchedule } from '../../../domain/value-object/one-on-one-schedule.vo';
import { OneOnOneTemplateContent } from '../../../domain/value-object/one-on-one-template-content.vo';
import { OneOnOneTemplateNotFoundError } from '../../one-on-one.errors';
import { OneOnOneMeetingsSoFarService } from '../../service/one-on-one-meetings-so-far.service';
import { OneOnOneTemplateCatalogService } from '../../service/one-on-one-template-catalog.service';
import { OneOnOneTemplateNamesService } from '../../service/one-on-one-template-names.service';
import { InviteToOneOnOneUseCase } from '../invite-to-one-on-one.use-case';
import { RescheduleOneOnOneUseCase } from '../reschedule-one-on-one.use-case';
import { KeepOneOnOneTemplateUseCase } from './keep-one-on-one-template.use-case';
import { ListOneOnOneTemplatesUseCase } from './list-one-on-one-templates.use-case';
import { RemoveOneOnOneTemplateUseCase } from './remove-one-on-one-template.use-case';
import { RewriteOneOnOneTemplateUseCase } from './rewrite-one-on-one-template.use-case';

const WORKSPACE_ID = 'workspace-acme';
/** An Admin. */
const ANN = 'account-ann';
const KRIT = 'account-krit';
const MINT = 'account-mint';
const NOW = new Date('2026-11-26T03:00:00.000Z');
const OURS_ID = '0199b6a0-0000-7000-8000-000000000001';
const KRITS_ID = '0199b6a0-0000-7000-8000-000000000002';
const MINTS_ID = '0199b6a0-0000-7000-8000-000000000003';
const CHOICE = {
  cadence: 'WEEKLY',
  weekday: 4,
  templateKey: 'weekly-check-in',
};

function setUp() {
  const templates = new FakeOneOnOneTemplateRepository();
  const membership = new FakeWorkspaceMembershipPort()
    .withAdmins(WORKSPACE_ID, ANN)
    .with(WORKSPACE_ID, KRIT, MINT);
  const unitOfWork = new FakeUnitOfWork();
  const clock = new FakeClock(NOW);
  const catalog = new OneOnOneTemplateCatalogService(templates);
  const oneOnOnes = new FakeOneOnOneRepository();
  return {
    templates,
    catalog,
    oneOnOnes,
    list: new ListOneOnOneTemplatesUseCase(
      new FakeOneOnOneTemplateQuery(templates),
      membership,
    ),
    keep: new KeepOneOnOneTemplateUseCase(
      templates,
      membership,
      new FakeIdGenerator(
        OURS_ID,
        KRITS_ID,
        MINTS_ID,
        // For the keeps a test expects refused, which are given an id before they are checked.
        '0199b6a0-0000-7000-8000-000000000004',
        '0199b6a0-0000-7000-8000-000000000005',
      ),
      unitOfWork,
    ),
    rewrite: new RewriteOneOnOneTemplateUseCase(
      templates,
      membership,
      unitOfWork,
    ),
    remove: new RemoveOneOnOneTemplateUseCase(
      templates,
      membership,
      unitOfWork,
      clock,
    ),
    invite: new InviteToOneOnOneUseCase(
      oneOnOnes,
      catalog,
      membership,
      new FakeIdGenerator('one-on-one-1'),
      unitOfWork,
      clock,
    ),
    reschedule: new RescheduleOneOnOneUseCase(
      oneOnOnes,
      catalog,
      new OneOnOneMeetingsSoFarService(
        new FakeOneOnOneMeetingQuery(new FakeOneOnOneMeetingRepository()),
      ),
      new FakeOneOnOneMeetingRepository(),
      unitOfWork,
      clock,
    ),
  };
}

/** Ann keeps one for the Workspace, then Krit and Mint each keep one of their own, in that order. */
async function withThreeLayers(world: ReturnType<typeof setUp>) {
  await world.keep.execute({
    workspaceId: WORKSPACE_ID,
    accountId: ANN,
    scope: 'WORKSPACE',
    content: { name: 'Team health', questions: ['How is the team?'] },
  });
  await world.keep.execute({
    workspaceId: WORKSPACE_ID,
    accountId: KRIT,
    scope: 'PERSONAL',
    content: {
      name: 'Sprint retro',
      suggestedWhen: 'After each sprint',
      questions: ['What slowed us?', 'What helped?'],
    },
  });
  await world.keep.execute({
    workspaceId: WORKSPACE_ID,
    accountId: MINT,
    scope: 'PERSONAL',
    content: { name: 'Mint’s own', questions: ['What is on your mind?'] },
  });
}

function running(id: string, templateKey: string) {
  const oneOnOne = OneOnOne.invite({
    id,
    workspaceId: WORKSPACE_ID,
    startedByAccountId: KRIT,
    invitedAccountId: MINT,
    schedule: OneOnOneSchedule.plan({ ...CHOICE, templateKey }, NOW),
    note: null,
  });
  oneOnOne.accept(MINT, NOW);
  return oneOnOne;
}

describe('Listing 1:1 templates', () => {
  it("lists Thrive's first, then the Workspace's, then the caller's own, never another Member's", async () => {
    const world = setUp();
    await withThreeLayers(world);

    const listed = await world.list.execute({
      workspaceId: WORKSPACE_ID,
      accountId: KRIT,
    });

    expect(listed.items.map((each) => each.scope)).toEqual([
      ...Array<'THRIVE'>(6).fill('THRIVE'),
      'WORKSPACE',
      'PERSONAL',
    ]);
    expect(listed.items.slice(6).map((each) => [each.key, each.name])).toEqual([
      [OURS_ID, 'Team health'],
      [KRITS_ID, 'Sprint retro'],
    ]);
    expect(listed.items.map((each) => each.changeable)).toEqual([
      ...Array<boolean>(6).fill(false),
      false,
      true,
    ]);
    expect(listed.mayKeepForWorkspace).toBe(false);
  });

  it("lets an Admin change the Workspace's, and keep more for it", async () => {
    const world = setUp();
    await withThreeLayers(world);

    const listed = await world.list.execute({
      workspaceId: WORKSPACE_ID,
      accountId: ANN,
    });

    expect(listed.items.at(-1)).toMatchObject({
      key: OURS_ID,
      changeable: true,
    });
    expect(listed.mayKeepForWorkspace).toBe(true);
  });
});

describe('Keeping, rewriting and removing a template', () => {
  it("refuses a Member keeping one for the Workspace, and a name the caller's layer keeps already", async () => {
    const world = setUp();
    await withThreeLayers(world);

    await expect(
      world.keep.execute({
        workspaceId: WORKSPACE_ID,
        accountId: KRIT,
        scope: 'WORKSPACE',
        content: { name: 'Ours too', questions: ['Q?'] },
      }),
    ).rejects.toThrow(OneOnOneTemplateNotYoursError);
    await expect(
      world.keep.execute({
        workspaceId: WORKSPACE_ID,
        accountId: KRIT,
        scope: 'PERSONAL',
        content: { name: 'sprint RETRO', questions: ['Q?'] },
      }),
    ).rejects.toThrow(OneOnOneTemplateNameTakenError);
  });

  it('rewrites one the caller keeps, and answers not found for another Member’s own', async () => {
    const world = setUp();
    await withThreeLayers(world);

    await world.rewrite.execute({
      workspaceId: WORKSPACE_ID,
      accountId: KRIT,
      templateId: KRITS_ID,
      content: { name: 'Retro', questions: ['What should we stop?'] },
    });

    expect(world.templates.saved(KRITS_ID)?.snapshot()).toMatchObject({
      name: 'Retro',
      suggestedWhen: '',
      questions: ['What should we stop?'],
    });
    await expect(
      world.rewrite.execute({
        workspaceId: WORKSPACE_ID,
        accountId: MINT,
        templateId: KRITS_ID,
        content: { name: 'Taken over', questions: ['Q?'] },
      }),
    ).rejects.toThrow(OneOnOneTemplateNotFoundError);
  });

  it("refuses a Member rewriting or removing the Workspace's", async () => {
    const world = setUp();
    await withThreeLayers(world);

    await expect(
      world.rewrite.execute({
        workspaceId: WORKSPACE_ID,
        accountId: KRIT,
        templateId: OURS_ID,
        content: { name: 'Mine now', questions: ['Q?'] },
      }),
    ).rejects.toThrow(OneOnOneTemplateNotYoursError);
    await expect(
      world.remove.execute({
        workspaceId: WORKSPACE_ID,
        accountId: KRIT,
        templateId: OURS_ID,
      }),
    ).rejects.toThrow(OneOnOneTemplateNotYoursError);
  });

  it('removes one from every list, and a second removal finds nothing', async () => {
    const world = setUp();
    await withThreeLayers(world);

    await world.remove.execute({
      workspaceId: WORKSPACE_ID,
      accountId: KRIT,
      templateId: KRITS_ID,
    });

    const listed = await world.list.execute({
      workspaceId: WORKSPACE_ID,
      accountId: KRIT,
    });
    expect(listed.items.map((each) => each.key)).not.toContain(KRITS_ID);
    await expect(
      world.remove.execute({
        workspaceId: WORKSPACE_ID,
        accountId: KRIT,
        templateId: KRITS_ID,
      }),
    ).rejects.toThrow(OneOnOneTemplateNotFoundError);
  });
});

describe('Starting a 1:1 from a kept template', () => {
  it("invites with the caller's own or the Workspace's, but not another Member's own", async () => {
    const world = setUp();
    await withThreeLayers(world);

    const { id } = await world.invite.execute({
      workspaceId: WORKSPACE_ID,
      startedByAccountId: KRIT,
      invitedAccountId: MINT,
      schedule: { ...CHOICE, templateKey: KRITS_ID },
      note: null,
    });

    expect(world.oneOnOnes.saved(id)?.snapshot().schedule.templateKey).toBe(
      KRITS_ID,
    );
    await expect(
      world.catalog.assertChoosable(WORKSPACE_ID, KRIT, MINTS_ID),
    ).rejects.toThrow(OneOnOneTemplateUnknownError);
    await expect(
      world.catalog.assertChoosable(WORKSPACE_ID, KRIT, OURS_ID),
    ).resolves.toBeUndefined();
    await expect(
      world.catalog.assertChoosable(WORKSPACE_ID, KRIT, 'not-a-template'),
    ).rejects.toThrow(OneOnOneTemplateUnknownError);
  });

  it('lets the other person change the time and keep a template that is not theirs, but not choose one', async () => {
    const world = setUp();
    await withThreeLayers(world);
    world.oneOnOnes.with(running('with-mint', KRITS_ID));

    await world.reschedule.execute({
      workspaceId: WORKSPACE_ID,
      accountId: MINT,
      oneOnOneId: 'with-mint',
      schedule: { ...CHOICE, weekday: 2, templateKey: KRITS_ID },
    });

    expect(
      world.oneOnOnes.saved('with-mint')?.snapshot().schedule.weekday,
    ).toBe(2);
    world.oneOnOnes.with(running('with-mint-2', 'weekly-check-in'));
    await expect(
      world.reschedule.execute({
        workspaceId: WORKSPACE_ID,
        accountId: MINT,
        oneOnOneId: 'with-mint-2',
        schedule: { ...CHOICE, templateKey: KRITS_ID },
      }),
    ).rejects.toThrow(OneOnOneTemplateUnknownError);
  });

  it("answers a template's name and questions as it reads now, removed or not", async () => {
    const world = setUp();
    await withThreeLayers(world);
    await world.remove.execute({
      workspaceId: WORKSPACE_ID,
      accountId: KRIT,
      templateId: KRITS_ID,
    });

    expect(await world.catalog.questionsOf(WORKSPACE_ID, KRITS_ID)).toEqual([
      'What slowed us?',
      'What helped?',
    ]);
    // Named as a meeting reads it, removed or not.
    const names = new OneOnOneTemplateNamesService(
      new FakeOneOnOneTemplateQuery(world.templates),
    );
    expect(
      await names.namesOf(WORKSPACE_ID, ['weekly-check-in', KRITS_ID]),
    ).toEqual([
      { key: 'weekly-check-in', name: 'Weekly check-in' },
      { key: KRITS_ID, name: 'Sprint retro' },
    ]);
    expect(await world.catalog.questionsOf(WORKSPACE_ID, MINTS_ID)).toEqual([
      'What is on your mind?',
    ]);
  });
});

describe('What a removal frees, and what it does not', () => {
  it('refuses inviting with a removed template, and rewriting it, but frees its name', async () => {
    const world = setUp();
    await withThreeLayers(world);
    await world.remove.execute({
      workspaceId: WORKSPACE_ID,
      accountId: KRIT,
      templateId: KRITS_ID,
    });

    await expect(
      world.invite.execute({
        workspaceId: WORKSPACE_ID,
        startedByAccountId: KRIT,
        invitedAccountId: MINT,
        schedule: { ...CHOICE, templateKey: KRITS_ID },
        note: null,
      }),
    ).rejects.toThrow(OneOnOneTemplateUnknownError);
    await expect(
      world.rewrite.execute({
        workspaceId: WORKSPACE_ID,
        accountId: KRIT,
        templateId: KRITS_ID,
        content: { name: 'Back again', questions: ['Q?'] },
      }),
    ).rejects.toThrow(OneOnOneTemplateNotFoundError);
    await expect(
      world.keep.execute({
        workspaceId: WORKSPACE_ID,
        accountId: KRIT,
        scope: 'PERSONAL',
        content: { name: 'Sprint retro', questions: ['What slowed us?'] },
      }),
    ).resolves.toEqual({ id: '0199b6a0-0000-7000-8000-000000000004' });
  });

  it('answers not found to a Member removing another Member’s own', async () => {
    const world = setUp();
    await withThreeLayers(world);

    await expect(
      world.remove.execute({
        workspaceId: WORKSPACE_ID,
        accountId: MINT,
        templateId: KRITS_ID,
      }),
    ).rejects.toThrow(OneOnOneTemplateNotFoundError);
    expect(world.templates.saved(KRITS_ID)?.isRemoved()).toBe(false);
  });

  it('refuses one template more than a layer keeps, not counting the removed', async () => {
    const templates = new FakeOneOnOneTemplateRepository().with(
      ...Array.from({ length: MAX_TEMPLATES_PER_LAYER }, (_, i) =>
        OneOnOneTemplate.keep({
          id: `0199b6a0-0000-7000-8000-1000000000${String(i).padStart(2, '0')}`,
          workspaceId: WORKSPACE_ID,
          scope: 'PERSONAL',
          by: { accountId: KRIT, isAdmin: false },
          content: OneOnOneTemplateContent.of({
            name: `Template ${i}`,
            questions: ['Q?'],
          }),
        }),
      ),
    );
    const membership = new FakeWorkspaceMembershipPort().with(
      WORKSPACE_ID,
      KRIT,
    );
    const keep = new KeepOneOnOneTemplateUseCase(
      templates,
      membership,
      new FakeIdGenerator(OURS_ID, KRITS_ID),
      new FakeUnitOfWork(),
    );
    const remove = new RemoveOneOnOneTemplateUseCase(
      templates,
      membership,
      new FakeUnitOfWork(),
      new FakeClock(NOW),
    );
    const one = { name: 'One more', questions: ['Q?'] };

    await expect(
      keep.execute({
        workspaceId: WORKSPACE_ID,
        accountId: KRIT,
        scope: 'PERSONAL',
        content: one,
      }),
    ).rejects.toThrow(OneOnOneTemplateLimitReachedError);
    await remove.execute({
      workspaceId: WORKSPACE_ID,
      accountId: KRIT,
      templateId: '0199b6a0-0000-7000-8000-100000000000',
    });
    await expect(
      keep.execute({
        workspaceId: WORKSPACE_ID,
        accountId: KRIT,
        scope: 'PERSONAL',
        content: one,
      }),
    ).resolves.toEqual({ id: KRITS_ID });
  });
});
