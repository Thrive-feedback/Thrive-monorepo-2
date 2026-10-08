import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import { Body, Controller, Headers, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiHeader,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { CreateWorkspaceUseCase } from '../application/use-cases/create-workspace.use-case';
import {
  CreateWorkspaceRequestDto,
  CreateWorkspaceResponseDto,
} from './dto/create-workspace.dto';

@ApiTags('workspaces')
@Controller({ path: 'v1/workspaces' })
export class WorkspaceController {
  constructor(
    private readonly createWorkspaceUseCase: CreateWorkspaceUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a Workspace, with the caller as its Owner' })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.CREATED, type: CreateWorkspaceResponseDto })
  @ApiBadRequestResponse({
    description:
      'REQUEST_INVALID, WORKSPACE_NAME_EMPTY or WORKSPACE_NAME_TOO_LONG',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiConflictResponse({
    description: 'PROFILE_REQUIRED or ALREADY_IN_A_WORKSPACE',
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
}
