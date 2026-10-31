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
import { ListWaitingAsksUseCase } from '../application/use-cases/list-waiting-asks.use-case';
import { toFeedbackAskResponse } from './dto/feedback-response.mapper';
import {
  ListWaitingAsksQueryDto,
  ListWaitingAsksResponseDto,
} from './dto/list-waiting-asks.dto';
import { WorkspacePathParamsDto } from './dto/path-params.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/**
 * The Asks still waiting on the caller, paged by cursor (ADR 0059). The offset list on
 * `feedback-asks` stays for `/home` and goes when it does.
 *
 * Who the caller is comes from the session, so nothing here can name somebody else's Asks.
 */
@ApiTags('feedback')
@Controller({ path: 'v1/workspaces/:workspaceId/waiting-asks' })
@UseGuards(WorkspaceMemberGuard)
export class WaitingAsksController {
  constructor(
    private readonly listWaitingAsksUseCase: ListWaitingAsksUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List the Asks still waiting for the caller' })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListWaitingAsksResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listWaitingAsks(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Query() query: ListWaitingAsksQueryDto,
  ) {
    const asks = await this.listWaitingAsksUseCase.execute({
      workspaceId: params.workspaceId,
      giverAccountId: actor.accountId,
      sort: query.sort,
      page: { afterId: query.cursor, limit: query.limit },
    });
    return {
      items: asks.items.map(toFeedbackAskResponse),
      nextCursor: toCursor(asks.nextAfterId),
    };
  }
}
