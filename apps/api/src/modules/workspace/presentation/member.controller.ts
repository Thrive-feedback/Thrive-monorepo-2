import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import { Controller, Get, Headers, HttpStatus, Query } from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { GetCurrentMembershipUseCase } from '../application/use-cases/get-current-membership.use-case';
import { ListMyMembershipsUseCase } from '../application/use-cases/list-my-memberships.use-case';
import { GetCurrentMembershipResponseDto } from './dto/get-current-membership.dto';
import {
  ListMyMembershipsQueryDto,
  ListMyMembershipsResponseDto,
} from './dto/list-my-memberships.dto';

/** `mine` is the caller's own memberships, as `sessions/current` is their own session. */
@ApiTags('workspace')
@Controller({ path: 'v1/members' })
export class MemberController {
  constructor(
    private readonly listMyMembershipsUseCase: ListMyMembershipsUseCase,
    private readonly getCurrentMembershipUseCase: GetCurrentMembershipUseCase,
  ) {}

  @Get('mine/current')
  @ApiOperation({
    summary:
      "The Workspace the caller's session is in, or none while they are to choose one",
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: GetCurrentMembershipResponseDto })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  async getCurrentMembership(
    @CurrentActor() actor: Actor,
    @Headers('cookie') cookie: string | undefined,
  ) {
    const membership = await this.getCurrentMembershipUseCase.execute({
      accountId: actor.accountId,
      credential: cookie ?? '',
    });
    return {
      membership: membership && {
        workspace: {
          id: membership.workspace.id,
          name: membership.workspace.name,
        },
        role: membership.role,
      },
    };
  }

  @Get('mine')
  @ApiOperation({
    summary:
      'List the Workspaces the caller is a Member of, the one used last first, or those they were Deactivated in',
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
      status: query.status,
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
