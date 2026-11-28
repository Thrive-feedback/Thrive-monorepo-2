import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
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
import { CountProfileItemsUseCase } from '../application/use-cases/count-profile-items.use-case';
import {
  CountProfileItemsQueryDto,
  CountProfileItemsResponseDto,
} from './dto/count-profile-items.dto';
import { MemberPathParamsDto } from './dto/path-params.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/**
 * How many items each of a Member's Profile lists holds for the caller (ADR 0097). It counts only
 * what those lists show the caller, so it needs no rule beyond theirs: who the caller is comes from
 * the session.
 */
@ApiTags('feedback')
@Controller({
  path: 'v1/workspaces/:workspaceId/members/:accountId/profile-item-counts',
})
@UseGuards(WorkspaceMemberGuard)
export class ProfileItemCountsController {
  constructor(
    private readonly countProfileItemsUseCase: CountProfileItemsUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      "Count each of a Member's Profile lists as the caller reads them, optionally from an instant on",
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: CountProfileItemsResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async countProfileItems(
    @CurrentActor() actor: Actor,
    @Param() params: MemberPathParamsDto,
    @Query() query: CountProfileItemsQueryDto,
  ) {
    return this.countProfileItemsUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: params.accountId,
      readerAccountId: actor.accountId,
      since: query.since,
    });
  }
}
