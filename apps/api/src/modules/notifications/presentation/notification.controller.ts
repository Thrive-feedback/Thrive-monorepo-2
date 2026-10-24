import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { CountMyUnreadUseCase } from '../application/use-cases/count-my-unread.use-case';
import { ListMyNotificationsUseCase } from '../application/use-cases/list-my-notifications.use-case';
import { MarkAllReadUseCase } from '../application/use-cases/mark-all-read.use-case';
import { MarkNotificationReadUseCase } from '../application/use-cases/mark-notification-read.use-case';
import {
  ListNotificationsQueryDto,
  ListNotificationsResponseDto,
} from './dto/list-notifications.dto';
import {
  NotificationPathParamsDto,
  WorkspacePathParamsDto,
} from './dto/path-params.dto';
import { UnreadCountResponseDto } from './dto/unread-count.dto';
import {
  CurrentWorkspaceAccess,
  type WorkspaceAccess,
  WorkspaceMemberGuard,
} from './workspace-member.guard';

/**
 * The caller's own bell in one Workspace: what they have been told here, how much of it they
 * have not read, and marking it read.
 *
 * **No route here can name a person.** The recipient is the session's Account on every one of
 * them, and the only id any route takes is a Workspace's or a Notification's — so there is no
 * shape of request that reads or clears somebody else's bell, and "nobody sees anybody else's"
 * is a property of this surface rather than a check somebody has to remember. Marking read is
 * refused for an id that is not the caller's as a plain not-found: the existence of a
 * Notification is itself the fact worth keeping, since it says a named person was asked,
 * answered or written to.
 *
 * The Workspace is in the path, unlike a Linked Account's routes, because a Notification belongs
 * to one: a Member of several reads one bell at a time and nothing from the others.
 */
@ApiTags('notifications')
@Controller({ path: 'v1/workspaces/:workspaceId/notifications' })
@UseGuards(WorkspaceMemberGuard)
export class NotificationController {
  constructor(
    private readonly listMyNotificationsUseCase: ListMyNotificationsUseCase,
    private readonly countMyUnreadUseCase: CountMyUnreadUseCase,
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
    private readonly markAllReadUseCase: MarkAllReadUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List what I have been told about in this Workspace, newest first',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListNotificationsResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listMine(
    @CurrentActor() actor: Actor,
    @CurrentWorkspaceAccess() access: WorkspaceAccess,
    // Declared so the path parameter reaches the contract; the guard has already resolved it.
    @Param() _params: WorkspacePathParamsDto,
    @Query() query: ListNotificationsQueryDto,
  ) {
    const page = { page: query.page, pageSize: query.pageSize };
    const notifications = await this.listMyNotificationsUseCase.execute({
      workspaceId: access.workspaceId,
      recipientAccountId: actor.accountId,
      page,
    });
    return {
      items: notifications.items.map((notification) => ({
        id: notification.id,
        type: notification.type,
        actor: {
          accountId: notification.actorAccountId,
          name: notification.actorName,
        },
        subjectId: notification.subjectId,
        createdAt: notification.createdAt.toISOString(),
        readAt: notification.readAt?.toISOString() ?? null,
      })),
      total: notifications.total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'How many things I have been told about here and not yet read',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: UnreadCountResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async countMyUnread(
    @CurrentActor() actor: Actor,
    @CurrentWorkspaceAccess() access: WorkspaceAccess,
    @Param() _params: WorkspacePathParamsDto,
  ) {
    const count = await this.countMyUnreadUseCase.execute({
      workspaceId: access.workspaceId,
      recipientAccountId: actor.accountId,
    });
    return { count };
  }

  @Post('read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Mark everything I have been told about in this Workspace as read',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'The bell is clear in this Workspace.' })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async markAllRead(
    @CurrentActor() actor: Actor,
    @CurrentWorkspaceAccess() access: WorkspaceAccess,
    @Param() _params: WorkspacePathParamsDto,
  ): Promise<void> {
    await this.markAllReadUseCase.execute({
      workspaceId: access.workspaceId,
      recipientAccountId: actor.accountId,
    });
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark one thing I was told about as read' })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'It no longer counts as unread.' })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or NOTIFICATION_NOT_FOUND',
  })
  async markRead(
    @CurrentActor() actor: Actor,
    @CurrentWorkspaceAccess() access: WorkspaceAccess,
    @Param() params: NotificationPathParamsDto,
  ): Promise<void> {
    await this.markNotificationReadUseCase.execute({
      workspaceId: access.workspaceId,
      recipientAccountId: actor.accountId,
      notificationId: params.id,
    });
  }
}
