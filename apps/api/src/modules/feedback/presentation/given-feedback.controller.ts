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
import { ListGivenFeedbackUseCase } from '../application/use-cases/list-given-feedback.use-case';
import { toFeedbackResponse } from './dto/feedback-response.mapper';
import {
  ListGivenFeedbackQueryDto,
  ListGivenFeedbackResponseDto,
} from './dto/list-given-feedback.dto';
import { WorkspacePathParamsDto } from './dto/path-params.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/**
 * The Feedback a Member wrote — a separate resource from `feedback`, which means what was written
 * *to* the caller. Both people are named, as on every list a Receiver is not reading.
 *
 * Who the caller is comes from the session, so there is no parameter on this route that could
 * name somebody else and read what they wrote.
 */
@ApiTags('feedback')
@Controller({ path: 'v1/workspaces/:workspaceId/given-feedback' })
@UseGuards(WorkspaceMemberGuard)
export class GivenFeedbackController {
  constructor(
    private readonly listGivenFeedbackUseCase: ListGivenFeedbackUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List the Feedback the caller has given in this Workspace',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListGivenFeedbackResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listGivenFeedback(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Query() query: ListGivenFeedbackQueryDto,
  ) {
    const page = { page: query.page, pageSize: query.pageSize };
    const given = await this.listGivenFeedbackUseCase.execute({
      workspaceId: params.workspaceId,
      giverAccountId: actor.accountId,
      page,
    });
    return {
      items: given.items.map(toFeedbackResponse),
      total: given.total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }
}
