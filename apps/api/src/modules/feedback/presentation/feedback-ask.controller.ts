import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import type { MyAskView } from '../application/types/feedback-request.types';
import { AnswerFeedbackAskUseCase } from '../application/use-cases/answer-feedback-ask.use-case';
import { GetFeedbackAskUseCase } from '../application/use-cases/get-feedback-ask.use-case';
import { ListMyFeedbackAsksUseCase } from '../application/use-cases/list-my-feedback-asks.use-case';
import {
  AnswerFeedbackAskRequestDto,
  AnswerFeedbackAskResponseDto,
} from './dto/answer-feedback-ask.dto';
import { toTagsResponse } from './dto/feedback-response.mapper';
import { GetFeedbackAskResponseDto } from './dto/get-feedback-ask.dto';
import {
  ListMyFeedbackAsksQueryDto,
  ListMyFeedbackAsksResponseDto,
} from './dto/list-my-feedback-asks.dto';
import {
  FeedbackAskPathParamsDto,
  WorkspacePathParamsDto,
} from './dto/path-params.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/** One Ask on the wire, with its dates written as the contract declares them. */
function toResponse(ask: MyAskView) {
  return {
    askId: ask.askId,
    feedbackRequestId: ask.feedbackRequestId,
    message: ask.message,
    tags: toTagsResponse(ask.tags),
    requester: {
      accountId: ask.requesterAccountId,
      name: ask.requesterName,
      photoUrl: ask.requesterPhotoUrl,
      status: ask.requesterStatus,
    },
    status: ask.status,
    createdAt: ask.createdAt.toISOString(),
  };
}

/**
 * The Asks addressed to the caller in one Workspace — the only read of an Ask that has no
 * request id, because a Giver learns they were asked here before they have seen anything.
 *
 * Both routes are scoped to the caller inside the read itself, not filtered afterwards: an Ask
 * addressed to somebody else is not found, which is also the answer for one that never existed.
 */
@ApiTags('feedback')
@Controller({ path: 'v1/workspaces/:workspaceId/feedback-asks' })
@UseGuards(WorkspaceMemberGuard)
export class FeedbackAskController {
  constructor(
    private readonly listMyFeedbackAsksUseCase: ListMyFeedbackAsksUseCase,
    private readonly getFeedbackAskUseCase: GetFeedbackAskUseCase,
    private readonly answerFeedbackAskUseCase: AnswerFeedbackAskUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List the Asks waiting for the caller to answer' })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListMyFeedbackAsksResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listMyFeedbackAsks(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Query() query: ListMyFeedbackAsksQueryDto,
  ) {
    const page = { page: query.page, pageSize: query.pageSize };
    const asks = await this.listMyFeedbackAsksUseCase.execute({
      workspaceId: params.workspaceId,
      giverAccountId: actor.accountId,
      status: query.status,
      page,
    });
    return {
      items: asks.items.map(toResponse),
      total: asks.total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  @Get(':askId')
  @ApiOperation({
    summary: 'Read one Ask waiting for the caller: who asked, and about what',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: GetFeedbackAskResponseDto })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or FEEDBACK_ASK_NOT_FOUND',
  })
  async getFeedbackAsk(
    @CurrentActor() actor: Actor,
    @Param() params: FeedbackAskPathParamsDto,
  ) {
    const ask = await this.getFeedbackAskUseCase.execute({
      workspaceId: params.workspaceId,
      giverAccountId: actor.accountId,
      askId: params.askId,
    });
    return { ...toResponse(ask), onWorkspaceFeed: ask.onWorkspaceFeed };
  }

  @Post(':askId/answers')
  @ApiOperation({
    summary:
      'Answer an Ask waiting for the caller, in one free-text answer, on its postcard or not',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({
    status: HttpStatus.CREATED,
    type: AnswerFeedbackAskResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'REQUEST_INVALID, FEEDBACK_MESSAGE_EMPTY, FEEDBACK_MESSAGE_TOO_LONG or POSTCARD_INVALID',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or FEEDBACK_ASK_NOT_FOUND',
  })
  @ApiConflictResponse({ description: 'ASK_ALREADY_ANSWERED' })
  async answerFeedbackAsk(
    @CurrentActor() actor: Actor,
    @Param() params: FeedbackAskPathParamsDto,
    @Body() body: AnswerFeedbackAskRequestDto,
  ) {
    const answered = await this.answerFeedbackAskUseCase.execute({
      workspaceId: params.workspaceId,
      giverAccountId: actor.accountId,
      askId: params.askId,
      message: body.message,
      postcard: body.postcard,
    });
    return { feedbackId: answered.feedbackId };
  }
}
