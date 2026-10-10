import {
  type Actor,
  CurrentActor,
  Public,
} from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
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
import { AcceptInvitationUseCase } from '../application/use-cases/accept-invitation.use-case';
import { GetInvitationUseCase } from '../application/use-cases/get-invitation.use-case';
import { GetInvitationResponseDto } from './dto/get-invitation.dto';
import { InvitationPathParamsDto } from './dto/invitation-path-params.dto';

/**
 * Where an Invitation's link leads: the invited person reads it, signed in or not, and accepts
 * it once signed in. Addressed by the Invitation alone, because whoever holds the link is not
 * yet a Member of the Workspace it names.
 */
@ApiTags('workspace')
@Controller({ path: 'v1/invitations/:invitationId' })
export class InvitationLinkController {
  constructor(
    private readonly getInvitationUseCase: GetInvitationUseCase,
    private readonly acceptInvitationUseCase: AcceptInvitationUseCase,
  ) {}

  @Get()
  @Public()
  @ApiOperation({
    summary:
      'Read an Invitation as the person holding its link sees it, signed in or not',
  })
  @ZodResponse({ status: HttpStatus.OK, type: GetInvitationResponseDto })
  @ApiNotFoundResponse({ description: 'INVITATION_NOT_FOUND' })
  async getInvitation(@Param() params: InvitationPathParamsDto) {
    const invitation = await this.getInvitationUseCase.execute({
      invitationId: params.invitationId,
    });
    return {
      workspaceName: invitation.workspaceName,
      inviterName: invitation.inviterName ?? undefined,
      invitedEmailMasked: invitation.invitedEmailMasked,
      status: invitation.status,
    };
  }

  @Post('accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Accept an Invitation, joining its Workspace; repeating it once in changes nothing',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Accepted, or already a Member there' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({ description: 'INVITATION_NOT_FOR_YOU' })
  @ApiNotFoundResponse({ description: 'INVITATION_NOT_FOUND' })
  @ApiConflictResponse({
    description:
      'INVITATION_EXPIRED, INVITATION_REVOKED, INVITATION_ALREADY_ACCEPTED or ALREADY_IN_A_WORKSPACE',
  })
  async acceptInvitation(
    @CurrentActor() actor: Actor,
    @Headers('cookie') cookie: string | undefined,
    @Param() params: InvitationPathParamsDto,
  ): Promise<void> {
    await this.acceptInvitationUseCase.execute({
      accountId: actor.accountId,
      accountEmail: actor.email,
      credential: cookie ?? '',
      invitationId: params.invitationId,
    });
  }
}
