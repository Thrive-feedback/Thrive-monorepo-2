import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import {
  Body,
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
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { CreateWorkspaceGoalUseCase } from '../application/use-cases/create-workspace-goal.use-case';
import { HideWorkspaceGoalUseCase } from '../application/use-cases/hide-workspace-goal.use-case';
import { ListWorkspaceGoalsUseCase } from '../application/use-cases/list-workspace-goals.use-case';
import { ShowWorkspaceGoalUseCase } from '../application/use-cases/show-workspace-goal.use-case';
import {
  CreateWorkspaceGoalRequestDto,
  CreateWorkspaceGoalResponseDto,
} from './dto/create-workspace-goal.dto';
import {
  ListWorkspaceGoalsQueryDto,
  ListWorkspaceGoalsResponseDto,
} from './dto/list-workspace-goals.dto';
import {
  WorkspaceGoalPathParamsDto,
  WorkspacePathParamsDto,
} from './dto/workspace-goal-path-params.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/**
 * A Workspace's Workspace Goals. Hiding and showing again are actions on one, because nothing
 * else about it ever changes: there is deliberately no route to rename or delete one.
 */
@ApiTags('workspace-goals')
@Controller({ path: 'v1/workspaces/:workspaceId/workspace-goals' })
@UseGuards(WorkspaceMemberGuard)
export class WorkspaceGoalController {
  constructor(
    private readonly listWorkspaceGoalsUseCase: ListWorkspaceGoalsUseCase,
    private readonly createWorkspaceGoalUseCase: CreateWorkspaceGoalUseCase,
    private readonly hideWorkspaceGoalUseCase: HideWorkspaceGoalUseCase,
    private readonly showWorkspaceGoalUseCase: ShowWorkspaceGoalUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      "List a Workspace's Workspace Goals: every one for an Admin, the active ones for anyone else",
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListWorkspaceGoalsResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listWorkspaceGoals(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Query() query: ListWorkspaceGoalsQueryDto,
  ) {
    const page = { page: query.page, pageSize: query.pageSize };
    const workspaceGoals = await this.listWorkspaceGoalsUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      page,
    });
    return {
      items: workspaceGoals.items.map((workspaceGoal) => ({
        id: workspaceGoal.id,
        name: workspaceGoal.name,
        description: workspaceGoal.description,
        status: workspaceGoal.status,
      })),
      total: workspaceGoals.total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Add a Workspace Goal to a Workspace, as an Admin' })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({
    status: HttpStatus.CREATED,
    type: CreateWorkspaceGoalResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'REQUEST_INVALID, WORKSPACE_GOAL_NAME_EMPTY, WORKSPACE_GOAL_NAME_TOO_LONG, WORKSPACE_GOAL_NAME_HAS_SPACES, WORKSPACE_GOAL_NAME_INVALID_CHARACTER or WORKSPACE_GOAL_DESCRIPTION_TOO_LONG',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({
    description: 'NOT_ALLOWED_TO_MANAGE_WORKSPACE_GOALS',
  })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  @ApiConflictResponse({ description: 'WORKSPACE_GOAL_NAME_TAKEN' })
  async createWorkspaceGoal(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Body() body: CreateWorkspaceGoalRequestDto,
  ) {
    const created = await this.createWorkspaceGoalUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      name: body.name,
      description: body.description,
    });
    return { id: created.id };
  }

  @Post(':workspaceGoalId/hide')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Hide a Workspace Goal, as an Admin, so Members no longer see or write it',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Hidden' })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({
    description: 'NOT_ALLOWED_TO_MANAGE_WORKSPACE_GOALS',
  })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or WORKSPACE_GOAL_NOT_FOUND',
  })
  @ApiConflictResponse({ description: 'WORKSPACE_GOAL_ALREADY_HIDDEN' })
  async hideWorkspaceGoal(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspaceGoalPathParamsDto,
  ): Promise<void> {
    await this.hideWorkspaceGoalUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      workspaceGoalId: params.workspaceGoalId,
    });
  }

  @Post(':workspaceGoalId/show')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Show a hidden Workspace Goal again, as an Admin',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Shown' })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({
    description: 'NOT_ALLOWED_TO_MANAGE_WORKSPACE_GOALS',
  })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or WORKSPACE_GOAL_NOT_FOUND',
  })
  @ApiConflictResponse({ description: 'WORKSPACE_GOAL_ALREADY_ACTIVE' })
  async showWorkspaceGoal(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspaceGoalPathParamsDto,
  ): Promise<void> {
    await this.showWorkspaceGoalUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      workspaceGoalId: params.workspaceGoalId,
    });
  }
}
