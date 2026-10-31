import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import { toCursor } from '@app/shared/presentation/dto/page.dto';
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
import { GiveKudosUseCase } from '../application/use-cases/give-kudos.use-case';
import { ListWorkspaceKudosUseCase } from '../application/use-cases/list-workspace-kudos.use-case';
import {
  toKudosCardResponse,
  toTagsResponse,
} from './dto/feedback-response.mapper';
import {
  GiveKudosRequestDto,
  GiveKudosResponseDto,
} from './dto/give-kudos.dto';
import {
  ListWorkspaceKudosQueryDto,
  ListWorkspaceKudosResponseDto,
} from './dto/list-workspace-kudos.dto';
import { WorkspacePathParamsDto } from './dto/path-params.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/**
 * Kudos: praise given to the teammates it @mentions, which every Member of the Workspace reads
 * (brain `ADR-0043`). The first collection here to page by cursor (ADR 0059).
 *
 * As on the Workspace feed, the list has no person in its read, so `WorkspaceMemberGuard` is the
 * whole of its authorization. The Giver comes from the session, so nothing here can name anybody
 * else as the writer.
 */
@ApiTags('kudos')
@Controller({ path: 'v1/workspaces/:workspaceId/kudos' })
@UseGuards(WorkspaceMemberGuard)
export class KudosController {
  constructor(
    private readonly giveKudosUseCase: GiveKudosUseCase,
    private readonly listWorkspaceKudosUseCase: ListWorkspaceKudosUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Give Kudos to the Members of this Workspace it @mentions, or to all of them',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.CREATED, type: GiveKudosResponseDto })
  @ApiBadRequestResponse({
    description:
      'REQUEST_INVALID, KUDOS_MESSAGE_EMPTY, KUDOS_MESSAGE_TOO_LONG or KUDOS_CARD_INVALID',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async giveKudos(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Body() body: GiveKudosRequestDto,
  ) {
    const given = await this.giveKudosUseCase.execute({
      workspaceId: params.workspaceId,
      giverAccountId: actor.accountId,
      message: body.message,
      card: body.card ?? null,
    });
    return { id: given.id };
  }

  @Get()
  @ApiOperation({ summary: 'List the Kudos given in this Workspace' })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListWorkspaceKudosResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listWorkspaceKudos(
    @Param() params: WorkspacePathParamsDto,
    @Query() query: ListWorkspaceKudosQueryDto,
  ) {
    const kudos = await this.listWorkspaceKudosUseCase.execute({
      workspaceId: params.workspaceId,
      page: { afterId: query.cursor, limit: query.limit },
    });
    return {
      items: kudos.items.map((each) => ({
        id: each.id,
        giver: {
          accountId: each.giver.accountId,
          name: each.giver.name,
          status: each.giver.status,
        },
        recipients: each.recipients.map((recipient) => ({
          accountId: recipient.accountId,
          name: recipient.name,
          status: recipient.status,
        })),
        message: each.message,
        tags: toTagsResponse(each.tags),
        card: toKudosCardResponse(each.card),
        createdAt: each.createdAt.toISOString(),
      })),
      nextCursor: toCursor(kudos.nextAfterId),
    };
  }
}
