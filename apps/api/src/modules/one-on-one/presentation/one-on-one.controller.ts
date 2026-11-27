import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import { toCursor } from '@app/shared/presentation/dto/page.dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import type { OneOnOneView } from '../application/types/one-on-one.types';
import { AcceptOneOnOneUseCase } from '../application/use-cases/accept-one-on-one.use-case';
import { DeclineOneOnOneUseCase } from '../application/use-cases/decline-one-on-one.use-case';
import { EndOneOnOneUseCase } from '../application/use-cases/end-one-on-one.use-case';
import { GetOneOnOneUseCase } from '../application/use-cases/get-one-on-one.use-case';
import { InviteToOneOnOneUseCase } from '../application/use-cases/invite-to-one-on-one.use-case';
import { ListMyOneOnOnesUseCase } from '../application/use-cases/list-my-one-on-ones.use-case';
import { RescheduleOneOnOneUseCase } from '../application/use-cases/reschedule-one-on-one.use-case';
import { SuggestAnotherTimeUseCase } from '../application/use-cases/suggest-another-time.use-case';
import { DEFAULT_THRIVE_TEMPLATE_KEY } from '../domain/value-object/thrive-template.vo';
import {
  CreatedOneOnOneResponseDto,
  DeclineOneOnOneRequestDto,
  InviteToOneOnOneRequestDto,
  ListMyOneOnOnesQueryDto,
  ListMyOneOnOnesResponseDto,
  OneOnOnePathParamsDto,
  OneOnOneResponseDto,
  OneOnOneScheduleRequestDto,
  SuggestAnotherTimeRequestDto,
  WorkspacePathParamsDto,
} from './dto/one-on-one.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

const SCHEDULE_ERRORS =
  'ONE_ON_ONE_SCHEDULE_INVALID or ONE_ON_ONE_TEMPLATE_UNKNOWN';

function toResponse(view: OneOnOneView) {
  return {
    id: view.id,
    status: view.status,
    startedByAccountId: view.startedByAccountId,
    invitedAccountId: view.invitedAccountId,
    withAccountId: view.withAccountId,
    schedule: {
      cadence: view.schedule.cadence,
      weekday: view.schedule.weekday,
      templateKey: view.schedule.templateKey,
      templateName: view.templateName,
      startsOn: view.schedule.startsOn,
    },
    inviteNote: view.inviteNote,
    suggestedAt: view.suggestedAt?.toISOString() ?? null,
    answerNote: view.answerNote,
    nextMeetingAt: view.nextMeetingAt?.toISOString() ?? null,
    nextMeetingSkippedAt: view.nextMeetingSkippedAt?.toISOString() ?? null,
    answeredAt: view.answeredAt?.toISOString() ?? null,
    endedAt: view.endedAt?.toISOString() ?? null,
    createdAt: view.createdAt.toISOString(),
    meetingInProgress: view.meetingInProgress,
    hasFinishedMeeting: view.hasFinishedMeeting,
  };
}

/**
 * A schedule as the use cases take it. `templateKey` is deprecated and may be left out: a meeting no
 * longer opens with it, and the schedule keeps Thrive's Weekly check-in until the field is removed.
 */
function scheduleOf(
  schedule: OneOnOneScheduleRequestDto,
): OneOnOneScheduleRequestDto & { readonly templateKey: string } {
  return {
    ...schedule,
    templateKey: schedule.templateKey ?? DEFAULT_THRIVE_TEMPLATE_KEY,
  };
}

/**
 * A person's 1:1s in a Workspace (brain ADR-0060, proposed): inviting a teammate to one, answering,
 * ending, and saying when it meets. Accepting, declining and ending are actions on one, as each is a
 * change of its state.
 */
@ApiTags('one-on-ones')
@Controller({ path: 'v1/workspaces/:workspaceId/one-on-ones' })
@UseGuards(WorkspaceMemberGuard)
export class OneOnOneController {
  constructor(
    private readonly listMyOneOnOnesUseCase: ListMyOneOnOnesUseCase,
    private readonly getOneOnOneUseCase: GetOneOnOneUseCase,
    private readonly inviteToOneOnOneUseCase: InviteToOneOnOneUseCase,
    private readonly acceptOneOnOneUseCase: AcceptOneOnOneUseCase,
    private readonly declineOneOnOneUseCase: DeclineOneOnOneUseCase,
    private readonly endOneOnOneUseCase: EndOneOnOneUseCase,
    private readonly rescheduleOneOnOneUseCase: RescheduleOneOnOneUseCase,
    private readonly suggestAnotherTimeUseCase: SuggestAnotherTimeUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      "List the caller's 1:1s, running or waiting on an answer, whoever sent the invitation",
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListMyOneOnOnesResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listMyOneOnOnes(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Query() query: ListMyOneOnOnesQueryDto,
  ) {
    const page = await this.listMyOneOnOnesUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      page: { afterId: query.cursor, limit: query.limit },
    });
    return {
      items: page.items.map(toResponse),
      nextCursor: toCursor(page.nextAfterId),
    };
  }

  @Post()
  @ApiOperation({
    summary:
      'Invite a teammate to a 1:1, saying when it meets, and ask them to accept it',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.CREATED, type: CreatedOneOnOneResponseDto })
  @ApiBadRequestResponse({
    description: `REQUEST_INVALID, ONE_ON_ONE_WITH_YOURSELF, ONE_ON_ONE_INVITE_NOTE_TOO_LONG, ${SCHEDULE_ERRORS}`,
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or ONE_ON_ONE_PERSON_NOT_FOUND',
  })
  @ApiConflictResponse({ description: 'ONE_ON_ONE_ALREADY_EXISTS' })
  async inviteToOneOnOne(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Body() body: InviteToOneOnOneRequestDto,
  ) {
    return this.inviteToOneOnOneUseCase.execute({
      workspaceId: params.workspaceId,
      startedByAccountId: actor.accountId,
      invitedAccountId: body.invitedAccountId,
      schedule: scheduleOf(body.schedule),
      note: body.note ?? null,
    });
  }

  @Get(':oneOnOneId')
  @ApiOperation({ summary: 'Read one 1:1 the caller is in' })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: OneOnOneResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or ONE_ON_ONE_NOT_FOUND',
  })
  async getOneOnOne(
    @CurrentActor() actor: Actor,
    @Param() params: OneOnOnePathParamsDto,
  ) {
    const view = await this.getOneOnOneUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      oneOnOneId: params.oneOnOneId,
    });
    return toResponse(view);
  }

  @Post(':oneOnOneId/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Accept an invitation to a 1:1, on the schedule it was sent with',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Accepted' })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({ description: 'ONE_ON_ONE_NOT_YOURS_TO_ANSWER' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or ONE_ON_ONE_NOT_FOUND',
  })
  @ApiConflictResponse({
    description: 'ONE_ON_ONE_NOT_AWAITING_ANSWER or ONE_ON_ONE_TIME_PASSED',
  })
  async acceptOneOnOne(
    @CurrentActor() actor: Actor,
    @Param() params: OneOnOnePathParamsDto,
  ): Promise<void> {
    await this.acceptOneOnOneUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      oneOnOneId: params.oneOnOneId,
    });
  }

  @Post(':oneOnOneId/suggest')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Send an invitation back with another time, instead of declining it; it then waits on its sender',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Suggested' })
  @ApiBadRequestResponse({
    description: `REQUEST_INVALID, ONE_ON_ONE_INVITE_NOTE_TOO_LONG, ${SCHEDULE_ERRORS}`,
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({ description: 'ONE_ON_ONE_NOT_YOURS_TO_ANSWER' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or ONE_ON_ONE_NOT_FOUND',
  })
  @ApiConflictResponse({ description: 'ONE_ON_ONE_NOT_AWAITING_ANSWER' })
  async suggestAnotherTime(
    @CurrentActor() actor: Actor,
    @Param() params: OneOnOnePathParamsDto,
    @Body() body: SuggestAnotherTimeRequestDto,
  ): Promise<void> {
    await this.suggestAnotherTimeUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      oneOnOneId: params.oneOnOneId,
      schedule: scheduleOf(body.schedule),
      note: body.note ?? null,
    });
  }

  @Post(':oneOnOneId/decline')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Turn down an invitation to a 1:1' })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Declined' })
  @ApiBadRequestResponse({
    description: 'REQUEST_INVALID or ONE_ON_ONE_ANSWER_NOTE_TOO_LONG',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({ description: 'ONE_ON_ONE_NOT_YOURS_TO_ANSWER' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or ONE_ON_ONE_NOT_FOUND',
  })
  @ApiConflictResponse({ description: 'ONE_ON_ONE_NOT_AWAITING_ANSWER' })
  async declineOneOnOne(
    @CurrentActor() actor: Actor,
    @Param() params: OneOnOnePathParamsDto,
    @Body() body: DeclineOneOnOneRequestDto,
  ): Promise<void> {
    await this.declineOneOnOneUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      oneOnOneId: params.oneOnOneId,
      note: body.note ?? null,
    });
  }

  @Post(':oneOnOneId/end')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'End a running 1:1, or withdraw an invitation the caller sent that is not yet answered',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Ended' })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({ description: 'ONE_ON_ONE_NOT_YOURS_TO_WITHDRAW' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or ONE_ON_ONE_NOT_FOUND',
  })
  @ApiConflictResponse({
    description: 'ONE_ON_ONE_ALREADY_OVER or ONE_ON_ONE_MEETING_IN_PROGRESS',
  })
  async endOneOnOne(
    @CurrentActor() actor: Actor,
    @Param() params: OneOnOnePathParamsDto,
  ): Promise<void> {
    await this.endOneOnOneUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      oneOnOneId: params.oneOnOneId,
    });
  }

  @Put(':oneOnOneId/schedule')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Change when a 1:1 meets: either person once it runs, the sender before it is answered',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Rescheduled' })
  @ApiBadRequestResponse({
    description: `REQUEST_INVALID, ${SCHEDULE_ERRORS}`,
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({
    description: 'ONE_ON_ONE_NOT_YOURS_TO_CHANGE',
  })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or ONE_ON_ONE_NOT_FOUND',
  })
  @ApiConflictResponse({
    description: 'ONE_ON_ONE_NOT_RUNNING or ONE_ON_ONE_MEETING_IN_PROGRESS',
  })
  async rescheduleOneOnOne(
    @CurrentActor() actor: Actor,
    @Param() params: OneOnOnePathParamsDto,
    @Body() body: OneOnOneScheduleRequestDto,
  ): Promise<void> {
    await this.rescheduleOneOnOneUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      oneOnOneId: params.oneOnOneId,
      schedule: scheduleOf(body),
    });
  }
}
