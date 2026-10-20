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
import type { MembershipView } from '../application/types/membership.types';
import { ChangeMemberRoleUseCase } from '../application/use-cases/change-member-role.use-case';
import { DeactivateMemberUseCase } from '../application/use-cases/deactivate-member.use-case';
import { ListWorkspaceMembersUseCase } from '../application/use-cases/list-workspace-members.use-case';
import { ReactivateMemberUseCase } from '../application/use-cases/reactivate-member.use-case';
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

/**
 * The Members of one Workspace, readable by anyone who is one of them, managed by its Admins.
 * Each Member may also leave, by Deactivating themselves, and an Admin may bring them back.
 */
@ApiTags('workspace')
@Controller({ path: 'v1/workspaces/:workspaceId/members' })
@UseGuards(WorkspaceMemberGuard)
export class WorkspaceMemberController {
  constructor(
    private readonly listWorkspaceMembersUseCase: ListWorkspaceMembersUseCase,
    private readonly changeMemberRoleUseCase: ChangeMemberRoleUseCase,
    private readonly deactivateMemberUseCase: DeactivateMemberUseCase,
    private readonly reactivateMemberUseCase: ReactivateMemberUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'List the active Members of a Workspace and their Roles, or those Deactivated there',
  })
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
      status: query.status,
    });
    return {
      items: members.items.map((member) => ({
        accountId: member.accountId,
        email: member.email,
        fullName: member.fullName,
        displayName: member.displayName,
        slug: member.slug,
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

  @Post(':accountId/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      "End a Member's access to the Workspace, keeping their Feedback; anyone may Deactivate themselves, which is leaving, and an Admin anyone else",
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Deactivated' })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({ description: 'NOT_ALLOWED_TO_DEACTIVATE' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or MEMBER_NOT_FOUND',
  })
  @ApiConflictResponse({ description: 'LAST_ADMIN' })
  async deactivateMember(
    @CurrentActor() actor: Actor,
    @CurrentMembership() membership: MembershipView,
    @Param() params: WorkspaceMemberPathParamsDto,
  ): Promise<void> {
    await this.deactivateMemberUseCase.execute({
      deactivatorAccountId: actor.accountId,
      membership,
      accountId: params.accountId,
    });
  }

  @Post(':accountId/reactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Give a Deactivated Member their access back, with the Role they had; only Admins may',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Reactivated, or already active' })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({ description: 'NOT_ALLOWED_TO_REACTIVATE' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or MEMBER_NOT_FOUND',
  })
  async reactivateMember(
    @CurrentActor() actor: Actor,
    @CurrentMembership() membership: MembershipView,
    @Param() params: WorkspaceMemberPathParamsDto,
  ): Promise<void> {
    await this.reactivateMemberUseCase.execute({
      reactivatorAccountId: actor.accountId,
      membership,
      accountId: params.accountId,
    });
  }
}
