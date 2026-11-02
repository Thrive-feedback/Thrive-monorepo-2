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
import { ListGivenItemsUseCase } from '../application/use-cases/list-given-items.use-case';
import { toPersonalItemResponse } from './dto/feedback-response.mapper';
import {
  ListGivenItemsQueryDto,
  ListGivenItemsResponseDto,
} from './dto/list-given-items.dto';
import { WorkspacePathParamsDto } from './dto/path-params.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/**
 * What the signed-in Member wrote, as one list paged by one cursor (ADR 0059, ADR 0081).
 *
 * Who the caller is comes from the session, so there is no parameter on this route that could name
 * somebody else and read what they wrote.
 */
@ApiTags('feedback')
@Controller({ path: 'v1/workspaces/:workspaceId/given-items' })
@UseGuards(WorkspaceMemberGuard)
export class GivenItemsController {
  constructor(private readonly listGivenItemsUseCase: ListGivenItemsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'List the Feedback and Kudos the caller wrote' })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListGivenItemsResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listGivenItems(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Query() query: ListGivenItemsQueryDto,
  ) {
    const given = await this.listGivenItemsUseCase.execute({
      workspaceId: params.workspaceId,
      giverAccountId: actor.accountId,
      page: { afterId: query.cursor, limit: query.limit },
    });
    return {
      readerAccountId: actor.accountId,
      items: given.items.map(toPersonalItemResponse),
      nextCursor: toCursor(given.nextAfterId),
    };
  }
}
