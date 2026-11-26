import { Injectable } from '@nestjs/common';
import {
  ThriveTemplate,
  type ThriveTemplateDetails,
} from '../../domain/value-object/thrive-template.vo';

export interface OneOnOneTemplateView extends ThriveTemplateDetails {
  /** Thrive's own, which nobody changes. */
  readonly scope: 'THRIVE';
}

/**
 * A query: the 1:1 templates either person can start an agenda from. Thrive's own come first, in the order
 * Thrive ships them.
 */
@Injectable()
export class ListOneOnOneTemplatesUseCase {
  execute(): readonly OneOnOneTemplateView[] {
    return ThriveTemplate.all().map((template) => ({
      ...template.snapshot(),
      scope: 'THRIVE' as const,
    }));
  }
}
