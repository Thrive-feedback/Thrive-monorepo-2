import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import type { MembershipView } from '../application/types/membership.types';
import { CreateWorkspaceUseCase } from '../application/use-cases/create-workspace.use-case';
import { SwitchWorkspaceUseCase } from '../application/use-cases/switch-workspace.use-case';
import {
  CreateWorkspaceRequestDto,
  CreateWorkspaceResponseDto,
} from './dto/create-workspace.dto';
import { WorkspacePathParamsDto } from './dto/workspace-path-params.dto';
import {
  CurrentMembership,
  WorkspaceMemberGuard,
} from './workspace-member.guard';

@ApiTags('workspace')
@Controller({ path: 'v1/workspaces' })
export class WorkspaceController {
  constructor(
    private readonly createWorkspaceUseCase: CreateWorkspaceUseCase,
    private readonly switchWorkspaceUseCase: SwitchWorkspaceUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Create a Workspace, with the caller as its first Admin, and make it the one they are in',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.CREATED, type: CreateWorkspaceResponseDto })
  @ApiBadRequestResponse({
    description:
      'REQUEST_INVALID, WORKSPACE_NAME_EMPTY or WORKSPACE_NAME_TOO_LONG',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiConflictResponse({
    description: 'PROFILE_REQUIRED',
  })
  async createWorkspace(
    @CurrentActor() actor: Actor,
    @Headers('cookie') cookie: string | undefined,
    @Body() body: CreateWorkspaceRequestDto,
  ) {
    const created = await this.createWorkspaceUseCase.execute({
      accountId: actor.accountId,
      credential: cookie ?? '',
      name: body.name,
      teamSize: body.teamSize ?? null,
    });
    return { id: created.id };
  }

  @Post(':workspaceId/switch')
  @UseGuards(WorkspaceMemberGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Make this Workspace the one the caller is in, on every device, until they switch again',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Switched' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async switchWorkspace(
    @CurrentActor() actor: Actor,
    @CurrentMembership() membership: MembershipView,
    // Declared so the path parameter reaches the contract; the guard has already resolved it.
    @Param() _params: WorkspacePathParamsDto,
  ): Promise<void> {
    await this.switchWorkspaceUseCase.execute({
      accountId: actor.accountId,
      membership,
    });
  }
}
