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
import { ListSharedFeedbackUseCase } from '../application/use-cases/list-shared-feedback.use-case';
import { toFeedbackResponse } from './dto/feedback-response.mapper';
import {
  ListSharedFeedbackQueryDto,
  ListSharedFeedbackResponseDto,
} from './dto/list-shared-feedback.dto';
import { WorkspacePathParamsDto } from './dto/path-params.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/**
 * The Feedback a Member was shown without being part of it — a separate resource from
 * `feedback`, which means what was written *to* the caller. Both people are named here, because
 * the reader is neither of them.
 *
 * Who the caller is comes from the session, so there is no parameter on this route that could
 * name somebody else and read what they were shown.
 */
@ApiTags('feedback')
@Controller({ path: 'v1/workspaces/:workspaceId/shared-feedback' })
@UseGuards(WorkspaceMemberGuard)
export class SharedFeedbackController {
  constructor(
    private readonly listSharedFeedbackUseCase: ListSharedFeedbackUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'List the Feedback the caller was selected to read in this Workspace',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListSharedFeedbackResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listSharedFeedback(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Query() query: ListSharedFeedbackQueryDto,
  ) {
    const page = { page: query.page, pageSize: query.pageSize };
    const shared = await this.listSharedFeedbackUseCase.execute({
      workspaceId: params.workspaceId,
      readerAccountId: actor.accountId,
      page,
    });
    return {
      items: shared.items.map(toFeedbackResponse),
      total: shared.total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }
}
