import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import { toCursor } from '@app/shared/presentation/dto/page.dto';
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
import { ListFeedItemsUseCase } from '../application/use-cases/list-feed-items.use-case';
import {
  toFeedbackResponse,
  toPersonResponse,
  toTagsResponse,
} from './dto/feedback-response.mapper';
import {
  ListFeedItemsQueryDto,
  ListFeedItemsResponseDto,
} from './dto/list-feed-items.dto';
import { WorkspacePathParamsDto } from './dto/path-params.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/**
 * What a Member reads on Home, as one list paged by one cursor (ADR 0059, ADR 0071).
 *
 * Who the caller is comes from the session, so there is no parameter on this route that could
 * name somebody else and read what they were shown.
 */
@ApiTags('feedback')
@Controller({ path: 'v1/workspaces/:workspaceId/feed-items' })
@UseGuards(WorkspaceMemberGuard)
export class FeedItemsController {
  constructor(private readonly listFeedItemsUseCase: ListFeedItemsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'List what the caller reads on Home' })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListFeedItemsResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listFeedItems(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Query() query: ListFeedItemsQueryDto,
  ) {
    const feedItems = await this.listFeedItemsUseCase.execute({
      workspaceId: params.workspaceId,
      readerAccountId: actor.accountId,
      show: query.show,
      page: { afterId: query.cursor, limit: query.limit },
    });
    return {
      readerAccountId: actor.accountId,
      items: feedItems.items.map((feedback) => ({
        ...toFeedbackResponse(feedback),
        visibility: feedback.visibility,
        request: feedback.request && {
          message: feedback.request.message,
          tags: toTagsResponse(feedback.request.tags),
          requester: toPersonResponse(feedback.request.requester),
          asked: feedback.request.asked.map((ask) => ({
            person: toPersonResponse(ask.person),
            status: ask.status,
            answer: ask.answer && {
              message: ask.answer.message,
              tags: toTagsResponse(ask.answer.tags),
              answeredAt: ask.answer.answeredAt.toISOString(),
            },
          })),
        },
      })),
      nextCursor: toCursor(feedItems.nextAfterId),
    };
  }
}
