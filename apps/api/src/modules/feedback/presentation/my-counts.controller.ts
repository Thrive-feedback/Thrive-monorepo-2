import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import { Controller, Get, HttpStatus, Param, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { GetMyCountsUseCase } from '../application/use-cases/get-my-counts.use-case';
import { GetMyCountsResponseDto } from './dto/get-my-counts.dto';
import { WorkspacePathParamsDto } from './dto/path-params.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/**
 * The caller's own counts, beside Waiting for me and each kind of Received. The route cannot name a
 * person: the Member is the session, so there is no way to ask for somebody else's.
 */
@ApiTags('feedback')
@Controller({ path: 'v1/workspaces/:workspaceId/me/counts' })
@UseGuards(WorkspaceMemberGuard)
export class MyCountsController {
  constructor(private readonly getMyCountsUseCase: GetMyCountsUseCase) {}

  @Get()
  @ApiOperation({
    summary:
      'How many Asks wait on me, and what is new in each kind of my Received and in Shared with me',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: GetMyCountsResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async getMyCounts(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
  ) {
    const counts = await this.getMyCountsUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
    });
    return {
      waitingAsks: counts.waitingAsks,
      newAnswers: counts.newAnswers,
      newOffered: counts.newOffered,
      newKudos: counts.newKudos,
      newShared: counts.newShared,
    };
  }
}
