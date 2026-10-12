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
import { ListMyInvitationsUseCase } from '../application/use-cases/list-my-invitations.use-case';
import {
  ListMyInvitationsQueryDto,
  ListMyInvitationsResponseDto,
} from './dto/list-my-invitations.dto';

/**
 * `mine` is the Invitations sent to the caller's own address, as `members/mine` is their own
 * memberships.
 */
@ApiTags('workspace')
@Controller({ path: 'v1/invitations' })
export class MyInvitationController {
  constructor(
    private readonly listMyInvitationsUseCase: ListMyInvitationsUseCase,
  ) {}

  @Get('mine')
  @ApiOperation({
    summary:
      'List the Invitations sent to the caller that they can still accept, across every Workspace',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListMyInvitationsResponseDto })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  async listMyInvitations(
    @CurrentActor() actor: Actor,
    @Query() query: ListMyInvitationsQueryDto,
  ) {
    const page = { page: query.page, pageSize: query.pageSize };
    const invitations = await this.listMyInvitationsUseCase.execute({
      accountEmail: actor.email,
      page,
    });
    return {
      items: invitations.items.map((invitation) => ({
        invitationId: invitation.invitationId,
        workspace: {
          id: invitation.workspace.id,
          name: invitation.workspace.name,
          memberCount: invitation.workspace.memberCount,
        },
        invitedAt: invitation.invitedAt.toISOString(),
        expiresAt: invitation.expiresAt.toISOString(),
      })),
      total: invitations.total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }
}
