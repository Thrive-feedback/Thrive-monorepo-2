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
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import type { MembershipView } from '../application/types/membership.types';
import { ListWorkspaceMembersUseCase } from '../application/use-cases/list-workspace-members.use-case';
import {
  ListWorkspaceMembersQueryDto,
  ListWorkspaceMembersResponseDto,
} from './dto/list-workspace-members.dto';
import { WorkspacePathParamsDto } from './dto/workspace-path-params.dto';
import {
  CurrentMembership,
  WorkspaceMemberGuard,
} from './workspace-member.guard';

/** The Members of one Workspace, readable by anyone who is one of them. */
@ApiTags('workspace')
@Controller({ path: 'v1/workspaces/:workspaceId/members' })
@UseGuards(WorkspaceMemberGuard)
export class WorkspaceMemberController {
  constructor(
    private readonly listWorkspaceMembersUseCase: ListWorkspaceMembersUseCase,
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
        role: member.role,
      })),
      total: members.total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }
}
