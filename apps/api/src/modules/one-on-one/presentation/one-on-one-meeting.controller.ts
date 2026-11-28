import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import { toCursor } from '@app/shared/presentation/dto/page.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ZodResponse } from 'nestjs-zod';
import type { OneOnOneMeetingView } from '../application/types/one-on-one-meeting.types';
import { AddTopicUseCase } from '../application/use-cases/meetings/add-topic.use-case';
import { FinishMeetingUseCase } from '../application/use-cases/meetings/finish-meeting.use-case';
import { GetNextMeetingUseCase } from '../application/use-cases/meetings/get-next-meeting.use-case';
import { ListPastMeetingsUseCase } from '../application/use-cases/meetings/list-past-meetings.use-case';
import { OpenMeetingUseCase } from '../application/use-cases/meetings/open-meeting.use-case';
import { RemoveTemplateFromMeetingUseCase } from '../application/use-cases/meetings/remove-template-from-meeting.use-case';
import { RemoveTopicUseCase } from '../application/use-cases/meetings/remove-topic.use-case';
import { ReorderTopicsUseCase } from '../application/use-cases/meetings/reorder-topics.use-case';
import { StartMeetingUseCase } from '../application/use-cases/meetings/start-meeting.use-case';
import { UpdateTopicUseCase } from '../application/use-cases/meetings/update-topic.use-case';
import { UseTemplateForMeetingUseCase } from '../application/use-cases/meetings/use-template-for-meeting.use-case';
import { OneOnOnePathParamsDto } from './dto/one-on-one.dto';
import {
  AddTopicRequestDto,
  CreatedMeetingThingResponseDto,
  ListPastMeetingsQueryDto,
  ListPastMeetingsResponseDto,
  MeetingPathParamsDto,
  MeetingTemplatePathParamsDto,
  NextMeetingResponseDto,
  ReorderTopicsRequestDto,
  TopicPathParamsDto,
  UpdateTopicRequestDto,
  UseTemplateForMeetingRequestDto,
} from './dto/one-on-one-meeting.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

const iso = (date: Date | null) => date?.toISOString() ?? null;

function toMeetingResponse(view: OneOnOneMeetingView) {
  return {
    id: view.id,
    state: view.state,
    templateKey: view.templateKey,
    occursAt: iso(view.occursAt),
    startedAt: iso(view.startedAt),
    startedByAccountId: view.startedByAccountId,
    finishedAt: iso(view.finishedAt),
    finishedByAccountId: view.finishedByAccountId,
    topics: view.topics.map((topic) => ({
      id: topic.id,
      text: topic.text,
      source: topic.source,
      authorAccountId: topic.authorAccountId,
      position: topic.position,
      notes: topic.notes,
      notesUpdatedAt: iso(topic.notesUpdatedAt),
      notesUpdatedByAccountId: topic.notesUpdatedByAccountId,
      discussedAt: iso(topic.discussedAt),
      broughtFrom: topic.broughtFrom && { ...topic.broughtFrom },
      templateKey: topic.templateKey,
    })),
  };
}

const NOT_FOUND =
  'WORKSPACE_NOT_FOUND, ONE_ON_ONE_NOT_FOUND or ONE_ON_ONE_MEETING_NOT_FOUND';

/**
 * The meetings of one 1:1 (brain ADR-0060 §5, §6 and §10; ADR-0061, proposed): the next one's
 * agenda, opened by the first write to it, started and finished by either person; the note both write
 * on each topic; and the meetings already finished.
 */
@ApiTags('one-on-ones')
@Controller({ path: 'v1/workspaces/:workspaceId/one-on-ones/:oneOnOneId' })
@UseGuards(WorkspaceMemberGuard)
export class OneOnOneMeetingController {
  constructor(
    private readonly getNextMeetingUseCase: GetNextMeetingUseCase,
    private readonly listPastMeetingsUseCase: ListPastMeetingsUseCase,
    private readonly openMeetingUseCase: OpenMeetingUseCase,
    private readonly startMeetingUseCase: StartMeetingUseCase,
    private readonly finishMeetingUseCase: FinishMeetingUseCase,
    private readonly addTopicUseCase: AddTopicUseCase,
    private readonly updateTopicUseCase: UpdateTopicUseCase,
    private readonly removeTopicUseCase: RemoveTopicUseCase,
    private readonly reorderTopicsUseCase: ReorderTopicsUseCase,
    private readonly useTemplateForMeetingUseCase: UseTemplateForMeetingUseCase,
    private readonly removeTemplateFromMeetingUseCase: RemoveTemplateFromMeetingUseCase,
  ) {}

  @Get('meetings/next')
  @ApiOperation({
    summary:
      "Read a 1:1's next meeting: the one not finished, or what it will open with",
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: NextMeetingResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or ONE_ON_ONE_NOT_FOUND',
  })
  async getNextMeeting(
    @CurrentActor() actor: Actor,
    @Param() params: OneOnOnePathParamsDto,
  ) {
    const next = await this.getNextMeetingUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      oneOnOneId: params.oneOnOneId,
    });
    return {
      meeting: next.meeting && toMeetingResponse(next.meeting),
      carried: [...next.carried],
      templateQuestions: [...next.templateQuestions],
      templateName: next.templateName,
      templates: next.templates.map((template) => ({ ...template })),
      carriedFromSkipped: next.carriedFromSkipped,
      carriedTopics: next.carriedTopics.map((each) => ({ ...each })),
    };
  }

  @Get('meetings')
  @ApiOperation({ summary: "List a 1:1's finished meetings, newest first" })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListPastMeetingsResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or ONE_ON_ONE_NOT_FOUND',
  })
  async listPastMeetings(
    @CurrentActor() actor: Actor,
    @Param() params: OneOnOnePathParamsDto,
    @Query() query: ListPastMeetingsQueryDto,
  ) {
    const page = await this.listPastMeetingsUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      oneOnOneId: params.oneOnOneId,
      page: { afterId: query.cursor, limit: query.limit },
    });
    return {
      items: page.items.map(toMeetingResponse),
      nextCursor: toCursor(page.nextAfterId),
      skippedDays: [...page.skippedDays],
      templates: page.templates.map((template) => ({ ...template })),
    };
  }

  @Post('meetings')
  @ApiOperation({
    summary:
      "Open the next meeting's agenda, or answer the one already open (idempotent)",
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({
    status: HttpStatus.CREATED,
    type: CreatedMeetingThingResponseDto,
    description: 'Opened',
  })
  @ApiOkResponse({
    type: CreatedMeetingThingResponseDto,
    description: 'Already open: the meeting that is',
  })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or ONE_ON_ONE_NOT_FOUND',
  })
  @ApiConflictResponse({ description: 'ONE_ON_ONE_NOT_RUNNING' })
  async openMeeting(
    @CurrentActor() actor: Actor,
    @Param() params: OneOnOnePathParamsDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { id, opened } = await this.openMeetingUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      oneOnOneId: params.oneOnOneId,
    });
    // 201 when this call opened it; 200 when it answers the one already open (BE_07 R2).
    if (!opened) {
      response.status(HttpStatus.OK);
    }
    return { id };
  }

  @Post('meetings/:meetingId/start')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Start a meeting, whenever the two meet' })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Started' })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: NOT_FOUND })
  @ApiConflictResponse({
    description:
      'ONE_ON_ONE_NOT_RUNNING, ONE_ON_ONE_MEETING_ALREADY_STARTED or ONE_ON_ONE_MEETING_FINISHED',
  })
  async startMeeting(
    @CurrentActor() actor: Actor,
    @Param() params: MeetingPathParamsDto,
  ): Promise<void> {
    await this.startMeetingUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      oneOnOneId: params.oneOnOneId,
      meetingId: params.meetingId,
    });
  }

  @Post('meetings/:meetingId/finish')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Finish a meeting, sharing its summary with both people',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Finished' })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: NOT_FOUND })
  @ApiConflictResponse({
    description:
      'ONE_ON_ONE_NOT_RUNNING, ONE_ON_ONE_MEETING_NOT_STARTED or ONE_ON_ONE_MEETING_FINISHED',
  })
  async finishMeeting(
    @CurrentActor() actor: Actor,
    @Param() params: MeetingPathParamsDto,
  ): Promise<void> {
    await this.finishMeetingUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      oneOnOneId: params.oneOnOneId,
      meetingId: params.meetingId,
    });
  }

  @Post('meetings/:meetingId/topics')
  @ApiOperation({ summary: "Add a topic to a meeting's agenda" })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({
    status: HttpStatus.CREATED,
    type: CreatedMeetingThingResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'REQUEST_INVALID or ONE_ON_ONE_MEETING_TEXT_INVALID',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({
    description:
      'WORKSPACE_NOT_FOUND, ONE_ON_ONE_NOT_FOUND, ONE_ON_ONE_MEETING_NOT_FOUND or ONE_ON_ONE_TOPIC_SOURCE_NOT_FOUND',
  })
  @ApiConflictResponse({
    description:
      'ONE_ON_ONE_NOT_RUNNING, ONE_ON_ONE_MEETING_FINISHED or ONE_ON_ONE_TOPIC_ALREADY_ON_AGENDA',
  })
  addTopic(
    @CurrentActor() actor: Actor,
    @Param() params: MeetingPathParamsDto,
    @Body() body: AddTopicRequestDto,
  ) {
    return this.addTopicUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      oneOnOneId: params.oneOnOneId,
      meetingId: params.meetingId,
      text: body.text,
      broughtFrom: body.broughtFrom ?? null,
    });
  }

  @Patch('meetings/:meetingId/topics/:topicId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reword a topic, write its shared note, or tick it discussed',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Changed' })
  @ApiBadRequestResponse({
    description: 'REQUEST_INVALID or ONE_ON_ONE_MEETING_TEXT_INVALID',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({ description: 'ONE_ON_ONE_TOPIC_NOT_YOURS' })
  @ApiNotFoundResponse({
    description: `${NOT_FOUND} or ONE_ON_ONE_TOPIC_NOT_FOUND`,
  })
  @ApiConflictResponse({
    description:
      'ONE_ON_ONE_NOT_RUNNING, ONE_ON_ONE_MEETING_NOT_STARTED, ONE_ON_ONE_MEETING_FINISHED or ONE_ON_ONE_TOPIC_CHANGED',
  })
  async updateTopic(
    @CurrentActor() actor: Actor,
    @Param() params: TopicPathParamsDto,
    @Body() body: UpdateTopicRequestDto,
  ): Promise<void> {
    await this.updateTopicUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      oneOnOneId: params.oneOnOneId,
      meetingId: params.meetingId,
      topicId: params.topicId,
      text: body.text,
      note:
        body.note === undefined
          ? undefined
          : {
              text: body.note,
              readAt: body.noteReadAt ? new Date(body.noteReadAt) : null,
            },
      discussed: body.discussed,
    });
  }

  @Delete('meetings/:meetingId/topics/:topicId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Take a topic off the agenda' })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Removed' })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({ description: 'ONE_ON_ONE_TOPIC_NOT_YOURS' })
  @ApiNotFoundResponse({
    description: `${NOT_FOUND} or ONE_ON_ONE_TOPIC_NOT_FOUND`,
  })
  @ApiConflictResponse({
    description: 'ONE_ON_ONE_NOT_RUNNING or ONE_ON_ONE_MEETING_FINISHED',
  })
  async removeTopic(
    @CurrentActor() actor: Actor,
    @Param() params: TopicPathParamsDto,
  ): Promise<void> {
    await this.removeTopicUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      oneOnOneId: params.oneOnOneId,
      meetingId: params.meetingId,
      topicId: params.topicId,
    });
  }

  @Put('meetings/:meetingId/template')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      "Use a template for a meeting being prepared: its questions are added after the agenda's topics, and one in use is not used again",
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Used' })
  @ApiBadRequestResponse({
    description: 'REQUEST_INVALID or ONE_ON_ONE_TEMPLATE_UNKNOWN',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: NOT_FOUND })
  @ApiConflictResponse({
    description:
      'ONE_ON_ONE_NOT_RUNNING, ONE_ON_ONE_MEETING_ALREADY_STARTED, ONE_ON_ONE_MEETING_FINISHED or ONE_ON_ONE_TEMPLATE_IN_USE',
  })
  async useTemplateForMeeting(
    @CurrentActor() actor: Actor,
    @Param() params: MeetingPathParamsDto,
    @Body() body: UseTemplateForMeetingRequestDto,
  ): Promise<void> {
    await this.useTemplateForMeetingUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      oneOnOneId: params.oneOnOneId,
      meetingId: params.meetingId,
      templateKey: body.templateKey,
    });
  }

  @Delete('meetings/:meetingId/template/:templateKey')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Take a template off a meeting being prepared: every question it asked leaves the agenda at once',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({
    description: 'Taken off, or it was not on the agenda',
  })
  @ApiBadRequestResponse({
    description: 'REQUEST_INVALID or ONE_ON_ONE_TEMPLATE_UNKNOWN',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: NOT_FOUND })
  @ApiConflictResponse({
    description:
      'ONE_ON_ONE_NOT_RUNNING, ONE_ON_ONE_MEETING_ALREADY_STARTED or ONE_ON_ONE_MEETING_FINISHED',
  })
  async removeTemplateFromMeeting(
    @CurrentActor() actor: Actor,
    @Param() params: MeetingTemplatePathParamsDto,
  ): Promise<void> {
    await this.removeTemplateFromMeetingUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      oneOnOneId: params.oneOnOneId,
      meetingId: params.meetingId,
      templateKey: params.templateKey,
    });
  }

  @Put('meetings/:meetingId/topics/order')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Put the agenda in a new order' })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Reordered' })
  @ApiBadRequestResponse({
    description: 'REQUEST_INVALID or ONE_ON_ONE_TOPIC_ORDER_INVALID',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: NOT_FOUND })
  @ApiConflictResponse({
    description: 'ONE_ON_ONE_NOT_RUNNING or ONE_ON_ONE_MEETING_FINISHED',
  })
  async reorderTopics(
    @CurrentActor() actor: Actor,
    @Param() params: MeetingPathParamsDto,
    @Body() body: ReorderTopicsRequestDto,
  ): Promise<void> {
    await this.reorderTopicsUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      oneOnOneId: params.oneOnOneId,
      meetingId: params.meetingId,
      topicIds: body.topicIds,
    });
  }
}
