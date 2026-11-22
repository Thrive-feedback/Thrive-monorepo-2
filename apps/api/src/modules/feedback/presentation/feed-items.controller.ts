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
import { ListFeedItemDaysUseCase } from '../application/use-cases/list-feed-item-days.use-case';
import { ListFeedItemsUseCase } from '../application/use-cases/list-feed-items.use-case';
import {
  toFeedItemResponse,
  toKudosResponse,
} from './dto/feedback-response.mapper';
import {
  ListFeedItemDaysQueryDto,
  ListFeedItemDaysResponseDto,
} from './dto/list-feed-item-days.dto';
import {
  ListFeedItemsQueryDto,
  ListFeedItemsResponseDto,
} from './dto/list-feed-items.dto';
import { WorkspacePathParamsDto } from './dto/path-params.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/**
 * What a Member reads on Home, as one list paged by one cursor (ADR 0059, ADR 0071), and how much
 * of it each of the last seven days held (ADR 0095).
 *
 * Who the caller is comes from the session, so there is no parameter on these routes that could
 * name somebody else and read what they were shown.
 */
@ApiTags('feedback')
@Controller({ path: 'v1/workspaces/:workspaceId/feed-items' })
@UseGuards(WorkspaceMemberGuard)
export class FeedItemsController {
  constructor(
    private readonly listFeedItemsUseCase: ListFeedItemsUseCase,
    private readonly listFeedItemDaysUseCase: ListFeedItemDaysUseCase,
  ) {}

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
      items: feedItems.items.map((item) =>
        item.kind === 'KUDOS'
          ? { kind: item.kind, ...toKudosResponse(item), day: item.day }
          : {
              ...toFeedItemResponse(item),
              visibility: item.visibility,
              day: item.day,
            },
      ),
      nextCursor: toCursor(feedItems.nextAfterId),
    };
  }

  @Get('days')
  @ApiOperation({
    summary:
      'Count what the caller can read on Home on each of the last seven days',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListFeedItemDaysResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listFeedItemDays(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Query() query: ListFeedItemDaysQueryDto,
  ) {
    const view = await this.listFeedItemDaysUseCase.execute({
      workspaceId: params.workspaceId,
      readerAccountId: actor.accountId,
      show: query.show,
    });
    return {
      days: view.days.map((each) => ({
        day: each.day,
        offeredFeedback: each.offeredFeedback,
        requestedFeedback: each.requestedFeedback,
        kudos: each.kudos,
      })),
      totals: {
        offeredFeedback: view.totals.offeredFeedback,
        requestedFeedback: view.totals.requestedFeedback,
        kudos: view.totals.kudos,
      },
    };
  }
}
