import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import type { MembershipView } from '../application/types/membership.types';
import { ChangeMemberRoleUseCase } from '../application/use-cases/change-member-role.use-case';
import { ListWorkspaceMembersUseCase } from '../application/use-cases/list-workspace-members.use-case';
import { ChangeMemberRoleRequestDto } from './dto/change-member-role.dto';
import {
  ListWorkspaceMembersQueryDto,
  ListWorkspaceMembersResponseDto,
} from './dto/list-workspace-members.dto';
import { WorkspaceMemberPathParamsDto } from './dto/workspace-member-path-params.dto';
import { WorkspacePathParamsDto } from './dto/workspace-path-params.dto';
import {
  CurrentMembership,
  WorkspaceMemberGuard,
} from './workspace-member.guard';

/** The Members of one Workspace, readable by anyone who is one of them, managed by its Admins. */
@ApiTags('workspace')
@Controller({ path: 'v1/workspaces/:workspaceId/members' })
@UseGuards(WorkspaceMemberGuard)
export class WorkspaceMemberController {
  constructor(
    private readonly listWorkspaceMembersUseCase: ListWorkspaceMembersUseCase,
    private readonly changeMemberRoleUseCase: ChangeMemberRoleUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List the Members of a Workspace and their Roles' })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListWorkspaceMembersResponseDto })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listWorkspaceMembers(
    @CurrentMembership() membership: MembershipView,
    // Declared so the path parameter reaches the contract; the guard has already resolved it.
    @Param() _params: WorkspacePathParamsDto,
    @Query() query: ListWorkspaceMembersQueryDto,
  ) {
    const page = { page: query.page, pageSize: query.pageSize };
    const members = await this.listWorkspaceMembersUseCase.execute({
      membership,
      page,
    });
    return {
      items: members.items.map((member) => ({
        accountId: member.accountId,
        email: member.email,
        fullName: member.fullName,
        displayName: member.displayName,
        photoUrl: member.photoUrl,
        role: member.role,
      })),
      total: members.total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  @Patch(':accountId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      "Change a Member's Role to Admin or Member; the Workspace always keeps an Admin",
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Changed, or already that Role' })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({ description: 'NOT_ALLOWED_TO_CHANGE_ROLES' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or MEMBER_NOT_FOUND',
  })
  @ApiConflictResponse({ description: 'LAST_ADMIN' })
  async changeMemberRole(
    @CurrentActor() actor: Actor,
    @CurrentMembership() membership: MembershipView,
    @Headers('cookie') cookie: string | undefined,
    @Param() params: WorkspaceMemberPathParamsDto,
    @Body() body: ChangeMemberRoleRequestDto,
  ): Promise<void> {
    await this.changeMemberRoleUseCase.execute({
      credential: cookie ?? '',
      changerAccountId: actor.accountId,
      membership,
      accountId: params.accountId,
      role: body.role,
    });
  }
}
