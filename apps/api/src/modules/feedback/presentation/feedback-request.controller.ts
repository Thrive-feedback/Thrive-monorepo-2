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
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import type { FeedbackRequestView } from '../application/types/feedback-request.types';
import { GetFeedbackRequestUseCase } from '../application/use-cases/get-feedback-request.use-case';
import { ListSentFeedbackRequestsUseCase } from '../application/use-cases/list-sent-feedback-requests.use-case';
import { SendFeedbackRequestUseCase } from '../application/use-cases/send-feedback-request.use-case';
import { GetFeedbackRequestResponseDto } from './dto/get-feedback-request.dto';
import {
  ListSentFeedbackRequestsQueryDto,
  ListSentFeedbackRequestsResponseDto,
} from './dto/list-sent-feedback-requests.dto';
import {
  FeedbackRequestPathParamsDto,
  WorkspacePathParamsDto,
} from './dto/path-params.dto';
import {
  SendFeedbackRequestRequestDto,
  SendFeedbackRequestResponseDto,
} from './dto/send-feedback-request.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/** One Feedback Request on the wire, with its dates written as the contract declares them. */
function toResponse(request: FeedbackRequestView) {
  return {
    id: request.id,
    topic: request.topic,
    visibility: request.visibility,
    asks: request.asks.map((ask) => ({
      askId: ask.askId,
      giverAccountId: ask.giverAccountId,
      giverName: ask.giverName,
      status: ask.status,
    })),
    createdAt: request.createdAt.toISOString(),
  };
}

/**
 * The Feedback Requests of one Workspace. Who is asking comes from the session and who may
 * read these routes from the guard; neither is ever taken from the body.
 */
@ApiTags('feedback')
@Controller({ path: 'v1/workspaces/:workspaceId/feedback-requests' })
@UseGuards(WorkspaceMemberGuard)
export class FeedbackRequestController {
  constructor(
    private readonly sendFeedbackRequestUseCase: SendFeedbackRequestUseCase,
    private readonly getFeedbackRequestUseCase: GetFeedbackRequestUseCase,
    private readonly listSentFeedbackRequestsUseCase: ListSentFeedbackRequestsUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Ask a Member of this Workspace for Feedback on a Topic',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({
    status: HttpStatus.CREATED,
    type: SendFeedbackRequestResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'REQUEST_INVALID, TOPIC_EMPTY, TOPIC_TOO_LONG, CANNOT_ASK_YOURSELF, GIVER_ALREADY_ASKED or GIVER_NOT_IN_WORKSPACE',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async sendFeedbackRequest(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Body() body: SendFeedbackRequestRequestDto,
  ) {
    const sent = await this.sendFeedbackRequestUseCase.execute({
      workspaceId: params.workspaceId,
      requesterAccountId: actor.accountId,
      topic: body.topic,
      giverAccountIds: body.giverAccountIds,
    });
    return { id: sent.id };
  }

  @Get()
  @ApiOperation({
    summary: 'List the Feedback Requests the caller sent in this Workspace',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({
    status: HttpStatus.OK,
    type: ListSentFeedbackRequestsResponseDto,
  })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listSentFeedbackRequests(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Query() query: ListSentFeedbackRequestsQueryDto,
  ) {
    const page = { page: query.page, pageSize: query.pageSize };
    const sent = await this.listSentFeedbackRequestsUseCase.execute({
      workspaceId: params.workspaceId,
      requesterAccountId: actor.accountId,
      page,
    });
    return {
      items: sent.items.map(toResponse),
      total: sent.total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  @Get(':requestId')
  @ApiOperation({
    summary: 'Read one Feedback Request of this Workspace and who was asked',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: GetFeedbackRequestResponseDto })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or FEEDBACK_REQUEST_NOT_FOUND',
  })
  async getFeedbackRequest(
    @CurrentActor() actor: Actor,
    @Param() params: FeedbackRequestPathParamsDto,
  ) {
    const request = await this.getFeedbackRequestUseCase.execute({
      workspaceId: params.workspaceId,
      callerAccountId: actor.accountId,
      requestId: params.requestId,
    });
    return toResponse(request);
  }
}
