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
import { ListProfileItemsUseCase } from '../application/use-cases/list-profile-items.use-case';
import { toPersonalItemResponse } from './dto/feedback-response.mapper';
import {
  ListProfileItemsQueryDto,
  ListProfileItemsResponseDto,
} from './dto/list-profile-items.dto';
import { MemberPathParamsDto } from './dto/path-params.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/**
 * What one Member's Profile shows of what was written to them, as one list paged by one cursor
 * (ADR 0059). Anyone in the Workspace may read anyone's, because it holds only what the caller
 * already reads on Home; who the caller is comes from the session, so nothing here can name
 * somebody else and read what was shared with them.
 */
@ApiTags('feedback')
@Controller({
  path: 'v1/workspaces/:workspaceId/members/:accountId/profile-items',
})
@UseGuards(WorkspaceMemberGuard)
export class ProfileItemsController {
  constructor(
    private readonly listProfileItemsUseCase: ListProfileItemsUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'List the Feedback everyone reads, the Feedback shared with the caller, or the Kudos, written to a Member, as their Profile shows them',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListProfileItemsResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listProfileItems(
    @CurrentActor() actor: Actor,
    @Param() params: MemberPathParamsDto,
    @Query() query: ListProfileItemsQueryDto,
  ) {
    const shown = await this.listProfileItemsUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: params.accountId,
      readerAccountId: actor.accountId,
      show: query.show,
      page: { afterId: query.cursor, limit: query.limit },
    });
    return {
      readerAccountId: actor.accountId,
      items: shown.items.map(toPersonalItemResponse),
      nextCursor: toCursor(shown.nextAfterId),
    };
  }
}
