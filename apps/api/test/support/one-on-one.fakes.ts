import { OneOnOneQuery } from '@app/modules/one-on-one/application/query-port/one-on-one.query-port';
import { OneOnOneMeetingQuery } from '@app/modules/one-on-one/application/query-port/one-on-one-meeting.query-port';
import { OneOnOneTemplateQuery } from '@app/modules/one-on-one/application/query-port/one-on-one-template.query-port';
import type {
  OneOnOneRow,
  OneOnOneRowPage,
} from '@app/modules/one-on-one/application/types/one-on-one.types';
import type { OneOnOneMeetingProjection } from '@app/modules/one-on-one/application/types/one-on-one-meeting.types';
import type { OneOnOneTemplateRow } from '@app/modules/one-on-one/application/types/one-on-one-template.types';
import type { OneOnOne } from '@app/modules/one-on-one/domain/entity/one-on-one.entity';
import { OneOnOneMeeting } from '@app/modules/one-on-one/domain/entity/one-on-one-meeting.entity';
import type { OneOnOneTemplate } from '@app/modules/one-on-one/domain/entity/one-on-one-template.entity';
import { OneOnOneMeetingRepository } from '@app/modules/one-on-one/domain/repository/one-on-one-meeting-repository.port';
import { OneOnOneRepository } from '@app/modules/one-on-one/domain/repository/one-on-one-repository.port';
import {
  type OneOnOneTemplateLayer,
  OneOnOneTemplateRepository,
} from '@app/modules/one-on-one/domain/repository/one-on-one-template-repository.port';
import { ThriveTemplate } from '@app/modules/one-on-one/domain/value-object/thrive-template.vo';

/** Keeps the 1:1s saved, so a test can read back what a use case stored. */
export class FakeOneOnOneRepository extends OneOnOneRepository {
  private readonly stored = new Map<string, OneOnOne>();

  with(...oneOnOnes: OneOnOne[]): this {
    for (const oneOnOne of oneOnOnes) {
      this.stored.set(oneOnOne.snapshot().id, oneOnOne);
    }
    return this;
  }

  saved(id: string): OneOnOne | undefined {
    return this.stored.get(id);
  }

  get count(): number {
    return this.stored.size;
  }

  async findById(
    workspaceId: string,
    oneOnOneId: string,
  ): Promise<OneOnOne | null> {
    const found = this.stored.get(oneOnOneId);
    return found?.snapshot().workspaceId === workspaceId ? found : null;
  }

  async existsOpenBetween(
    workspaceId: string,
    firstAccountId: string,
    secondAccountId: string,
    at: Date,
  ): Promise<boolean> {
    const pair = [firstAccountId, secondAccountId].sort().join(':');
    return [...this.stored.values()].some((oneOnOne) => {
      const snapshot = oneOnOne.snapshot();
      return (
        snapshot.workspaceId === workspaceId &&
        oneOnOne.isOpenAt(at) &&
        [snapshot.startedByAccountId, snapshot.invitedAccountId]
          .sort()
          .join(':') === pair
      );
    });
  }

  async save(oneOnOne: OneOnOne): Promise<void> {
    this.stored.set(oneOnOne.snapshot().id, oneOnOne);
  }
}

/** Keeps the meetings saved, whole, so a test can read back what a use case stored. */
export class FakeOneOnOneMeetingRepository extends OneOnOneMeetingRepository {
  private readonly stored = new Map<string, OneOnOneMeeting>();

  saved(id: string): OneOnOneMeeting | undefined {
    return this.stored.get(id);
  }

  all(): readonly OneOnOneMeeting[] {
    return [...this.stored.values()];
  }

  async findById(
    workspaceId: string,
    oneOnOneId: string,
    meetingId: string,
  ): Promise<OneOnOneMeeting | null> {
    const found = this.stored.get(meetingId);
    const snapshot = found?.snapshot();
    return snapshot?.workspaceId === workspaceId &&
      snapshot.oneOnOneId === oneOnOneId
      ? (found ?? null)
      : null;
  }

  async findLive(
    workspaceId: string,
    oneOnOneId: string,
  ): Promise<OneOnOneMeeting | null> {
    return (
      this.all().find((meeting) => {
        const snapshot = meeting.snapshot();
        return (
          snapshot.workspaceId === workspaceId &&
          snapshot.oneOnOneId === oneOnOneId &&
          meeting.state() !== 'FINISHED'
        );
      }) ?? null
    );
  }

  async findLastFinished(
    workspaceId: string,
    oneOnOneId: string,
  ): Promise<OneOnOneMeeting | null> {
    const finished = this.all()
      .filter((meeting) => {
        const snapshot = meeting.snapshot();
        return (
          snapshot.workspaceId === workspaceId &&
          snapshot.oneOnOneId === oneOnOneId &&
          meeting.state() === 'FINISHED'
        );
      })
      .sort(
        (a, b) =>
          (b.snapshot().finishedAt?.getTime() ?? 0) -
          (a.snapshot().finishedAt?.getTime() ?? 0),
      );
    return finished[0] ?? null;
  }

  async save(meeting: OneOnOneMeeting): Promise<void> {
    this.stored.set(
      meeting.snapshot().id,
      OneOnOneMeeting.restore(meeting.snapshot()),
    );
  }
}

/** A meeting as the query side reads it, from what a fake repository holds. */
function projectionOf(meeting: OneOnOneMeeting): OneOnOneMeetingProjection {
  const {
    workspaceId: _workspaceId,
    oneOnOneId: _oneOnOneId,
    ...rest
  } = meeting.snapshot();
  return rest;
}

/** The read side over the same fakes, so a query sees what the use cases wrote. */
export class FakeOneOnOneMeetingQuery extends OneOnOneMeetingQuery {
  constructor(private readonly meetings: FakeOneOnOneMeetingRepository) {
    super();
  }

  async findLive(
    workspaceId: string,
    oneOnOneId: string,
  ): Promise<OneOnOneMeetingProjection | null> {
    const live = await this.meetings.findLive(workspaceId, oneOnOneId);
    return live ? projectionOf(live) : null;
  }

  async findLastFinished(
    workspaceId: string,
    oneOnOneId: string,
  ): Promise<OneOnOneMeetingProjection | null> {
    const last = await this.meetings.findLastFinished(workspaceId, oneOnOneId);
    return last ? projectionOf(last) : null;
  }

  async listHeldFor(
    workspaceId: string,
    oneOnOneId: string,
  ): Promise<readonly Date[]> {
    return this.meetings.all().flatMap((meeting) => {
      const snapshot = meeting.snapshot();
      return snapshot.workspaceId === workspaceId &&
        snapshot.oneOnOneId === oneOnOneId &&
        snapshot.finishedAt !== null &&
        snapshot.occursAt !== null
        ? [snapshot.occursAt]
        : [];
    });
  }

  async listFinished(
    workspaceId: string,
    oneOnOneId: string,
    page: { readonly afterId: string | null; readonly limit: number },
  ) {
    const finished = this.meetings
      .all()
      .filter((meeting) => {
        const snapshot = meeting.snapshot();
        return (
          snapshot.workspaceId === workspaceId &&
          snapshot.oneOnOneId === oneOnOneId &&
          snapshot.finishedAt !== null &&
          (page.afterId === null || snapshot.id < page.afterId)
        );
      })
      .map(projectionOf)
      .sort((a, b) => (a.id < b.id ? 1 : -1));
    const items = finished.slice(0, page.limit);
    return {
      items,
      nextAfterId:
        finished.length > page.limit ? (items.at(-1)?.id ?? null) : null,
    };
  }
}

/** The 1:1 read side over a fake repository: one 1:1, for one of its two people. */
export class FakeOneOnOneQuery extends OneOnOneQuery {
  constructor(
    private readonly oneOnOnes: FakeOneOnOneRepository,
    private readonly templates = new FakeOneOnOneTemplateRepository(),
  ) {
    super();
  }

  async listFor(): Promise<OneOnOneRowPage> {
    throw new Error('Not faked: list the 1:1s through the integration spec.');
  }

  async findFor(
    workspaceId: string,
    oneOnOneId: string,
    accountId: string,
  ): Promise<OneOnOneRow | null> {
    const found = await this.oneOnOnes.findById(workspaceId, oneOnOneId);
    if (!found?.isIn(accountId)) {
      return null;
    }
    const { workspaceId: _workspaceId, ...row } = found.snapshot();
    const key = row.schedule.templateKey;
    const templateName = ThriveTemplate.isKey(key)
      ? ThriveTemplate.of(key).snapshot().name
      : ((await this.templates.findById(workspaceId, key))?.snapshot().name ??
        'A template no longer kept');
    return {
      ...row,
      templateName,
      createdAt: new Date(0),
      meetingInProgress: false,
      hasFinishedMeeting: false,
      meetingInProgressFor: null,
      lastHeldFor: null,
    };
  }
}

/** Keeps the templates saved, so a test can read back what a use case stored. */
export class FakeOneOnOneTemplateRepository extends OneOnOneTemplateRepository {
  private readonly templates = new Map<string, OneOnOneTemplate>();

  with(...templates: OneOnOneTemplate[]): this {
    for (const template of templates) {
      this.templates.set(template.snapshot().id, template);
    }
    return this;
  }

  saved(id: string): OneOnOneTemplate | undefined {
    return this.templates.get(id);
  }

  async findById(
    workspaceId: string,
    templateId: string,
  ): Promise<OneOnOneTemplate | null> {
    const found = this.templates.get(templateId);
    return found?.snapshot().workspaceId === workspaceId ? found : null;
  }

  async keptIn(
    workspaceId: string,
    layer: OneOnOneTemplateLayer,
  ): Promise<readonly OneOnOneTemplate[]> {
    return [...this.templates.values()].filter((template) => {
      const snapshot = template.snapshot();
      return (
        snapshot.workspaceId === workspaceId &&
        snapshot.scope === layer.scope &&
        snapshot.ownerAccountId === layer.ownerAccountId &&
        snapshot.removedAt === null
      );
    });
  }

  async save(template: OneOnOneTemplate): Promise<void> {
    this.templates.set(template.snapshot().id, template);
  }
}

/** Answers from the templates `repository` keeps, as the real query would. */
export class FakeOneOnOneTemplateQuery extends OneOnOneTemplateQuery {
  constructor(private readonly repository: FakeOneOnOneTemplateRepository) {
    super();
  }

  async listSeenBy(
    workspaceId: string,
    accountId: string,
  ): Promise<readonly OneOnOneTemplateRow[]> {
    const workspace = await this.repository.keptIn(workspaceId, {
      scope: 'WORKSPACE',
      ownerAccountId: null,
    });
    const own = await this.repository.keptIn(workspaceId, {
      scope: 'PERSONAL',
      ownerAccountId: accountId,
    });
    const byName = (a: OneOnOneTemplate, b: OneOnOneTemplate) =>
      a.snapshot().name.localeCompare(b.snapshot().name);
    return [...[...workspace].sort(byName), ...[...own].sort(byName)].map(
      (template) => {
        const { id, scope, ownerAccountId, name, suggestedWhen, questions } =
          template.snapshot();
        return { id, scope, ownerAccountId, name, suggestedWhen, questions };
      },
    );
  }
}
