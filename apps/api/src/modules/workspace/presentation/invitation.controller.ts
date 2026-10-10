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
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import type { MembershipView } from '../application/types/membership.types';
import { ListWorkspaceInvitationsUseCase } from '../application/use-cases/list-workspace-invitations.use-case';
import { SendInvitationsUseCase } from '../application/use-cases/send-invitations.use-case';
import {
  ListWorkspaceInvitationsQueryDto,
  ListWorkspaceInvitationsResponseDto,
} from './dto/list-workspace-invitations.dto';
import {
  SendInvitationsRequestDto,
  SendInvitationsResponseDto,
} from './dto/send-invitations.dto';
import { WorkspacePathParamsDto } from './dto/workspace-path-params.dto';
import {
  CurrentMembership,
  WorkspaceMemberGuard,
} from './workspace-member.guard';

/**
 * Invitations to a Workspace. One send invites several people and answers for each, so it
 * is an action with a result of its own rather than the creation of one resource.
 */
@ApiTags('workspace')
@Controller({ path: 'v1/workspaces/:workspaceId/invitations' })
@UseGuards(WorkspaceMemberGuard)
export class InvitationController {
  constructor(
    private readonly sendInvitationsUseCase: SendInvitationsUseCase,
    private readonly listWorkspaceInvitationsUseCase: ListWorkspaceInvitationsUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'List the Invitations of a Workspace still waiting on someone, pending or expired',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({
    status: HttpStatus.OK,
    type: ListWorkspaceInvitationsResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({ description: 'NOT_ALLOWED_TO_SEE_INVITATIONS' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listWorkspaceInvitations(
    @CurrentMembership() membership: MembershipView,
    // Declared so the path parameter reaches the contract; the guard has already resolved it.
    @Param() _params: WorkspacePathParamsDto,
    @Query() query: ListWorkspaceInvitationsQueryDto,
  ) {
    const page = { page: query.page, pageSize: query.pageSize };
    const invitations = await this.listWorkspaceInvitationsUseCase.execute({
      membership,
      page,
    });
    return {
      items: invitations.items.map((invitation) => ({
        invitationId: invitation.invitationId,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt.toISOString(),
      })),
      total: invitations.total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Invite several people to a Workspace by email, at most 10 at a time',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: SendInvitationsResponseDto })
  @ApiBadRequestResponse({
    description:
      'REQUEST_INVALID, NO_ADDRESSES_TO_INVITE or TOO_MANY_INVITATIONS',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({ description: 'NOT_ALLOWED_TO_INVITE' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async sendInvitations(
    @CurrentActor() actor: Actor,
    @CurrentMembership() membership: MembershipView,
    @Headers('cookie') cookie: string | undefined,
    // Declared so the path parameter reaches the contract; the guard has already resolved it.
    @Param() _params: WorkspacePathParamsDto,
    @Body() body: SendInvitationsRequestDto,
  ) {
    const outcomes = await this.sendInvitationsUseCase.execute({
      accountId: actor.accountId,
      inviterEmail: actor.email,
      credential: cookie ?? '',
      membership,
      emails: body.emails,
    });
    return {
      results: outcomes.map((result) =>
        result.outcome === 'invited'
          ? {
              email: result.email,
              outcome: result.outcome,
              invitationId: result.invitationId,
              expiresAt: result.expiresAt.toISOString(),
            }
          : { email: result.email, outcome: result.outcome },
      ),
    };
  }
}
