import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import {
  Body,
  Controller,
  HttpStatus,
  Param,
  Post,
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
import { SendFeedbackRequestUseCase } from '../application/use-cases/send-feedback-request.use-case';
import { WorkspacePathParamsDto } from './dto/path-params.dto';
import {
  SendFeedbackRequestRequestDto,
  SendFeedbackRequestResponseDto,
} from './dto/send-feedback-request.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/**
 * Asking for Feedback in one Workspace. Who is asking comes from the session and who may
 * use this route from the guard; neither is ever taken from the body.
 */
@ApiTags('feedback')
@Controller({ path: 'v1/workspaces/:workspaceId/feedback-requests' })
@UseGuards(WorkspaceMemberGuard)
export class FeedbackRequestController {
  constructor(
    private readonly sendFeedbackRequestUseCase: SendFeedbackRequestUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Ask a Member of this Workspace for Feedback with a Request message, choosing who else reads the answers',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({
    status: HttpStatus.CREATED,
    type: SendFeedbackRequestResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'REQUEST_INVALID, REQUEST_MESSAGE_EMPTY, REQUEST_MESSAGE_TOO_LONG, POSTCARD_INVALID, CANNOT_ASK_YOURSELF, GIVER_ALREADY_ASKED, GIVER_NOT_IN_WORKSPACE, NO_PEOPLE_SELECTED, PEOPLE_SELECTED_FOR_ANOTHER_VISIBILITY, PERSON_ALREADY_SELECTED, CANNOT_SELECT_YOURSELF, MENTIONED_PERSON_LEFT_OUT or SELECTED_PERSON_NOT_IN_WORKSPACE',
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
      message: body.message,
      giverAccountIds: body.giverAccountIds,
      visibility: body.visibility,
      selectedAccountIds: body.selectedAccountIds ?? [],
      postcard: body.postcard,
    });
    return { id: sent.id };
  }
}
