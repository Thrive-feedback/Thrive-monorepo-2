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
import type { ReceivedFeedbackView } from '../application/types/feedback-request.types';
import { ListReceivedFeedbackUseCase } from '../application/use-cases/list-received-feedback.use-case';
import {
  ListReceivedFeedbackQueryDto,
  ListReceivedFeedbackResponseDto,
} from './dto/list-received-feedback.dto';
import { WorkspacePathParamsDto } from './dto/path-params.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/** One piece of Feedback on the wire, with its date written as the contract declares it. */
function toResponse(feedback: ReceivedFeedbackView) {
  return {
    id: feedback.id,
    feedbackRequestId: feedback.feedbackRequestId,
    topic: feedback.topic,
    giverAccountId: feedback.giverAccountId,
    giverName: feedback.giverName,
    body: feedback.body,
    createdAt: feedback.createdAt.toISOString(),
  };
}

/**
 * Feedback itself — the answers, rather than the requests that collected them. A separate
 * resource from `feedback-requests` because this is the one read with no request in it: it is
 * everything written to one Member, across every request they sent.
 *
 * The caller comes from the session and is the Receiver the read is scoped by, so there is no
 * parameter here that could name anybody else.
 */
@ApiTags('feedback')
@Controller({ path: 'v1/workspaces/:workspaceId/feedback' })
@UseGuards(WorkspaceMemberGuard)
export class FeedbackController {
  constructor(
    private readonly listReceivedFeedbackUseCase: ListReceivedFeedbackUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List the Feedback written to the caller in this Workspace',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({
    status: HttpStatus.OK,
    type: ListReceivedFeedbackResponseDto,
  })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listReceivedFeedback(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Query() query: ListReceivedFeedbackQueryDto,
  ) {
    const page = { page: query.page, pageSize: query.pageSize };
    const received = await this.listReceivedFeedbackUseCase.execute({
      workspaceId: params.workspaceId,
      receiverAccountId: actor.accountId,
      page,
    });
    return {
      items: received.items.map(toResponse),
      total: received.total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }
}
