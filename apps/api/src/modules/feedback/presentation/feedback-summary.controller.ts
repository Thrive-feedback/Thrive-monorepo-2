import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { GetMyFeedbackSummaryUseCase } from '../application/use-cases/get-my-feedback-summary.use-case';
import type {
  SummaryPoint,
  SummarySource,
} from '../domain/value-object/summary-section.vo';
import {
  FeedbackSummaryResponseDto,
  GetMyFeedbackSummaryQueryDto,
} from './dto/feedback-summary.dto';
import { WorkspacePathParamsDto } from './dto/path-params.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/**
 * What the Feedback written to the caller adds up to, read by the caller and nobody else.
 *
 * **The route cannot name a person** (design 0025 D8): the Member is the session, so there is
 * no id to widen, no guard to get wrong later, and no way to ask for somebody else's. Brain
 * `ADR-0051` d7 is a property of this shape rather than a check.
 */
@ApiTags('feedback-summary')
@Controller({ path: 'v1/workspaces/:workspaceId/me/summary' })
@UseGuards(WorkspaceMemberGuard)
export class FeedbackSummaryController {
  constructor(
    private readonly getMyFeedbackSummaryUseCase: GetMyFeedbackSummaryUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Read my own summary of the Feedback I received' })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: FeedbackSummaryResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async getMySummary(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Query() query: GetMyFeedbackSummaryQueryDto,
  ) {
    const { summary, isAvailable } =
      await this.getMyFeedbackSummaryUseCase.execute({
        workspaceId: params.workspaceId,
        accountId: actor.accountId,
        period: query.period ?? null,
      });

    return {
      isAvailable,
      summary:
        summary === null
          ? null
          : {
              period: summary.period,
              generatedAt: summary.generatedAt.toISOString(),
              isStale: summary.isStale,
              sourceCount: summary.sourceCount,
              language: summary.language,
              themes: toPoints(summary.sections.themes),
              strengths: toPoints(summary.sections.strengths),
              areas_to_improve: toPoints(summary.sections.areas_to_improve),
              suggested_actions: toPoints(summary.sections.suggested_actions),
            },
    };
  }
}

/** The response schema's own shape, which is mutable where the domain's is not. */
function toPoints(
  points: readonly SummaryPoint[],
): { point: string; sources: SummarySource[] }[] {
  return points.map((entry) => ({
    point: entry.point,
    sources: entry.sources.map((source) => ({ ...source })),
  }));
}
