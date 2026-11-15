import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
import { MarkListSeenUseCase } from '../application/use-cases/mark-list-seen.use-case';
import { MarkListSeenRequestDto } from './dto/mark-list-seen.dto';
import { WorkspacePathParamsDto } from './dto/path-params.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/**
 * Which of the caller's own lists they have opened, so `me/counts` counts only what is new since.
 * The route cannot name a person: the Member is the session.
 */
@ApiTags('feedback')
@Controller({ path: 'v1/workspaces/:workspaceId/me/seen' })
@UseGuards(WorkspaceMemberGuard)
export class MySeenController {
  constructor(private readonly markListSeenUseCase: MarkListSeenUseCase) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Mark one of my lists as seen, so only what comes after it counts as new',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Nothing in that list counts as new.' })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async markListSeen(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Body() body: MarkListSeenRequestDto,
  ): Promise<void> {
    await this.markListSeenUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      list: body.list,
    });
  }
}
