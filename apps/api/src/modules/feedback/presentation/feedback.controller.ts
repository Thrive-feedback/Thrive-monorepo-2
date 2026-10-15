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
import type {
  FeedbackView,
  ReceivedFeedbackView,
} from '../application/types/feedback-request.types';
import { GetFeedbackUseCase } from '../application/use-cases/get-feedback.use-case';
import { ListReceivedFeedbackUseCase } from '../application/use-cases/list-received-feedback.use-case';
import { GetFeedbackResponseDto } from './dto/get-feedback.dto';
import {
  ListReceivedFeedbackQueryDto,
  ListReceivedFeedbackResponseDto,
} from './dto/list-received-feedback.dto';
import {
  FeedbackPathParamsDto,
  WorkspacePathParamsDto,
} from './dto/path-params.dto';
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

/** One piece of Feedback on the wire, the same for every reader its Visibility lets in. */
function toFeedbackResponse(feedback: FeedbackView) {
  return {
    id: feedback.id,
    feedbackRequestId: feedback.feedbackRequestId,
    topic: feedback.topic,
    giver: { accountId: feedback.giverAccountId, name: feedback.giverName },
    receiver: {
      accountId: feedback.receiverAccountId,
      name: feedback.receiverName,
    },
    body: feedback.body,
    createdAt: feedback.createdAt.toISOString(),
  };
}

/**
 * Feedback itself — the answers, rather than the requests that collected them. A separate
 * resource from `feedback-requests`: the list is everything written to one Member, across every
 * request they sent, and one piece is opened by whoever its Visibility lets read it.
 *
 * The caller comes from the session — the Receiver the list is scoped by, the reader one piece
 * is checked against — so there is no parameter here that could name anybody else.
 */
@ApiTags('feedback')
@Controller({ path: 'v1/workspaces/:workspaceId/feedback' })
@UseGuards(WorkspaceMemberGuard)
export class FeedbackController {
  constructor(
    private readonly listReceivedFeedbackUseCase: ListReceivedFeedbackUseCase,
    private readonly getFeedbackUseCase: GetFeedbackUseCase,
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

  @Get(':feedbackId')
  @ApiOperation({
    summary:
      'Read one piece of Feedback, if its Visibility lets the caller read it',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: GetFeedbackResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or FEEDBACK_NOT_FOUND',
  })
  async getFeedback(
    @CurrentActor() actor: Actor,
    @Param() params: FeedbackPathParamsDto,
  ) {
    return toFeedbackResponse(
      await this.getFeedbackUseCase.execute({
        workspaceId: params.workspaceId,
        readerAccountId: actor.accountId,
        feedbackId: params.feedbackId,
      }),
    );
  }
}
