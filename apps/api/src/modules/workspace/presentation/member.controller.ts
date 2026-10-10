import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ListMyMembershipsUseCase } from '../application/use-cases/list-my-memberships.use-case';
import {
  ListMyMembershipsQueryDto,
  ListMyMembershipsResponseDto,
} from './dto/list-my-memberships.dto';

/**
 * `mine` is the caller's own memberships, as `sessions/current` is their own session. A
 * list, though today it holds at most one: one Workspace per person is a rule of this
 * release, not of the contract.
 */
@ApiTags('workspace')
@Controller({ path: 'v1/members' })
export class MemberController {
  constructor(
    private readonly listMyMembershipsUseCase: ListMyMembershipsUseCase,
  ) {}

  @Get('mine')
  @ApiOperation({
    summary: 'List the Workspaces the caller is a Member of, and their Role',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListMyMembershipsResponseDto })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  async listMyMemberships(
    @CurrentActor() actor: Actor,
    @Query() query: ListMyMembershipsQueryDto,
  ) {
    const page = { page: query.page, pageSize: query.pageSize };
    const memberships = await this.listMyMembershipsUseCase.execute({
      accountId: actor.accountId,
      page,
    });
    return {
      items: memberships.items.map((membership) => ({
        workspace: {
          id: membership.workspace.id,
          name: membership.workspace.name,
        },
        role: membership.role,
      })),
      total: memberships.total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }
}
