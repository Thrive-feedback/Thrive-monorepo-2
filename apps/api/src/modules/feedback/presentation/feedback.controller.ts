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
import type { ReceivedFeedbackView } from '../application/types/feedback-request.types';
import { GetFeedbackUseCase } from '../application/use-cases/get-feedback.use-case';
import { ListReceivedFeedbackUseCase } from '../application/use-cases/list-received-feedback.use-case';
import { OfferFeedbackUseCase } from '../application/use-cases/offer-feedback.use-case';
import {
  toAnsweredRequestResponse,
  toFeedbackResponse,
  toPersonResponse,
  toTagsResponse,
} from './dto/feedback-response.mapper';
import { GetFeedbackResponseDto } from './dto/get-feedback.dto';
import {
  ListReceivedFeedbackQueryDto,
  ListReceivedFeedbackResponseDto,
} from './dto/list-received-feedback.dto';
import {
  OfferFeedbackRequestDto,
  OfferFeedbackResponseDto,
} from './dto/offer-feedback.dto';
import {
  FeedbackPathParamsDto,
  WorkspacePathParamsDto,
} from './dto/path-params.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/** One piece of Feedback on the wire, with its date written as the contract declares it. */
function toResponse(feedback: ReceivedFeedbackView) {
  return {
    id: feedback.id,
    origin: feedback.origin,
    feedbackRequestId: feedback.feedbackRequestId,
    giverAccountId: feedback.giverAccountId,
    giverName: feedback.giverName,
    giverPhotoUrl: feedback.giverPhotoUrl,
    giverStatus: feedback.giverStatus,
    otherReceivers: feedback.otherReceivers.map(toPersonResponse),
    message: feedback.message,
    tags: toTagsResponse(feedback.tags),
    createdAt: feedback.createdAt.toISOString(),
    request: toAnsweredRequestResponse(feedback.request),
  };
}

/**
 * Feedback itself, rather than the requests that collect it. A separate resource from
 * `feedback-requests`: Feedback given without being asked has no request at all; the list is
 * everything written to one Member, asked for or not; and one piece is opened by whoever its
 * Visibility lets read it.
 *
 * The caller comes from the session — the Giver of what is given, the Receiver the list is
 * scoped by, the reader one piece is checked against — so there is no parameter here that could
 * name anybody else.
 */
@ApiTags('feedback')
@Controller({ path: 'v1/workspaces/:workspaceId/feedback' })
@UseGuards(WorkspaceMemberGuard)
export class FeedbackController {
  constructor(
    private readonly offerFeedbackUseCase: OfferFeedbackUseCase,
    private readonly listReceivedFeedbackUseCase: ListReceivedFeedbackUseCase,
    private readonly getFeedbackUseCase: GetFeedbackUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Give one or more Members of this Workspace Feedback without being asked for it',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.CREATED, type: OfferFeedbackResponseDto })
  @ApiBadRequestResponse({
    description:
      'REQUEST_INVALID, FEEDBACK_MESSAGE_EMPTY, FEEDBACK_MESSAGE_TOO_LONG, CANNOT_GIVE_YOURSELF_FEEDBACK, NO_RECEIVERS, RECEIVER_ALREADY_NAMED, RECEIVER_NOT_IN_WORKSPACE, NO_PEOPLE_SELECTED, PEOPLE_SELECTED_FOR_ANOTHER_VISIBILITY, PERSON_ALREADY_SELECTED, CANNOT_SELECT_YOURSELF, CANNOT_SELECT_THE_RECEIVER or SELECTED_PERSON_NOT_IN_WORKSPACE',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async offerFeedback(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Body() body: OfferFeedbackRequestDto,
  ) {
    const given = await this.offerFeedbackUseCase.execute({
      workspaceId: params.workspaceId,
      giverAccountId: actor.accountId,
      receiverAccountIds: body.receiverAccountIds,
      message: body.message,
      visibility: body.visibility,
      selectedAccountIds: body.selectedAccountIds ?? [],
    });
    return { id: given.id };
  }

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
