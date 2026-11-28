import { Injectable } from '@nestjs/common';
import {
  templateKeyOf,
  templateRefOf,
} from '../../domain/value-object/one-on-one-template-ref.vo';
import { ThriveTemplate } from '../../domain/value-object/thrive-template.vo';
import { OneOnOneTemplateQuery } from '../query-port/one-on-one-template.query-port';
import type { OneOnOneTemplateName } from '../types/one-on-one-meeting.types';

/**
 * What the templates a meeting's topics came from are called, for the queries that read meetings:
 * Thrive's from code, and the kept ones in one read however many there are (`BE_06` R9), through
 * the query contract rather than by loading templates (`BE_05` R4).
 */
@Injectable()
export class OneOnOneTemplateNamesService {
  constructor(private readonly templateQuery: OneOnOneTemplateQuery) {}

  /**
   * Each template's name, in the order given, by the key the wire carries. A kept one named but not
   * kept in the Workspace is a broken reference, which the foreign key forbids, so it is said loudly.
   */
  async namesOf(
    workspaceId: string,
    templateKeys: readonly string[],
  ): Promise<readonly OneOnOneTemplateName[]> {
    const refs = templateKeys.map((key) => templateRefOf(key));
    const kept = await this.templateQuery.namesOf(
      workspaceId,
      refs.flatMap((ref) => (ref.kind === 'KEPT' ? [ref.id] : [])),
    );
    const keptNames = new Map(kept.map(({ id, name }) => [id, name]));
    return refs.map((ref) => {
      const key = templateKeyOf(ref);
      if (ref.kind === 'THRIVE') {
        return { key, name: ThriveTemplate.of(ref.key).snapshot().name };
      }
      const name = keptNames.get(ref.id);
      if (name === undefined) {
        throw new Error(
          `Template ${ref.id} is named, but this Workspace does not keep it.`,
        );
      }
      return { key, name };
    });
  }
}
