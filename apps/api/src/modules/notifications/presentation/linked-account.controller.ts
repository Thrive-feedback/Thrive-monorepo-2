import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { BeginAccountLinkUseCase } from '../application/use-cases/begin-account-link.use-case';
import { CompleteAccountLinkUseCase } from '../application/use-cases/complete-account-link.use-case';
import { ListMyLinkedAccountsUseCase } from '../application/use-cases/list-my-linked-accounts.use-case';
import { UnlinkAccountUseCase } from '../application/use-cases/unlink-account.use-case';
import {
  BeginAccountLinkResponseDto,
  CompleteAccountLinkRequestDto,
  CompleteAccountLinkResponseDto,
} from './dto/link-account.dto';
import { ListLinkedAccountsResponseDto } from './dto/list-linked-accounts.dto';
import { LinkedAccountPathParamsDto } from './dto/path-params.dto';

/**
 * The caller's own links to chat tools. Linking is two steps rather than one, because the tool
 * authorises in between: Thrive answers where to send the Member, then reads back who they are.
 *
 * **There is no Workspace in the path and no guard beyond being signed in.** A Linked Account
 * belongs to an Account, so the Account always comes from the session and never from the
 * request — which is what makes "nobody else's Linked Account is visible to anybody" (#211
 * AC 7) a property of this surface rather than a check somebody has to remember. No route here
 * can name a person, so none can be asked about one.
 */
@ApiTags('linked-accounts')
@Controller({ path: 'v1/linked-accounts/mine' })
export class LinkedAccountController {
  constructor(
    private readonly beginAccountLinkUseCase: BeginAccountLinkUseCase,
    private readonly completeAccountLinkUseCase: CompleteAccountLinkUseCase,
    private readonly listMyLinkedAccountsUseCase: ListMyLinkedAccountsUseCase,
    private readonly unlinkAccountUseCase: UnlinkAccountUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List the chat accounts I have linked, and when each was linked',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListLinkedAccountsResponseDto })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  async listMine(@CurrentActor() actor: Actor) {
    const items = await this.listMyLinkedAccountsUseCase.execute({
      accountId: actor.accountId,
    });
    return {
      items: items.map((item) => ({
        provider: item.provider,
        externalUsername: item.externalUsername,
        linkedAt: item.linkedAt.toISOString(),
      })),
    };
  }

  @Post(':provider/link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Begin linking my own account in one chat tool',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: BeginAccountLinkResponseDto })
  @ApiBadRequestResponse({
    description: 'REQUEST_INVALID, PROVIDER_NOT_SUPPORTED',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  async beginLink(
    @CurrentActor() actor: Actor,
    @Param() params: LinkedAccountPathParamsDto,
  ) {
    return this.beginAccountLinkUseCase.execute({
      accountId: actor.accountId,
      provider: params.provider,
    });
  }

  @Post(':provider/complete')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Finish linking, with what the chat tool sent my browser back with',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({
    status: HttpStatus.CREATED,
    type: CompleteAccountLinkResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'REQUEST_INVALID, PROVIDER_NOT_SUPPORTED, LINK_STATE_INVALID',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiConflictResponse({
    description: 'LINK_REFUSED, ACCOUNT_ALREADY_LINKED',
  })
  async completeLink(
    @CurrentActor() actor: Actor,
    @Param() params: LinkedAccountPathParamsDto,
    @Body() body: CompleteAccountLinkRequestDto,
  ) {
    return this.completeAccountLinkUseCase.execute({
      accountId: actor.accountId,
      provider: params.provider,
      code: body.code,
      state: body.state,
    });
  }

  @Delete(':provider')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Unlink my account in one chat tool, so Thrive stops messaging me there',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'The link is forgotten.' })
  @ApiBadRequestResponse({
    description: 'REQUEST_INVALID, PROVIDER_NOT_SUPPORTED',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'NOT_LINKED' })
  async unlink(
    @CurrentActor() actor: Actor,
    @Param() params: LinkedAccountPathParamsDto,
  ) {
    await this.unlinkAccountUseCase.execute({
      accountId: actor.accountId,
      provider: params.provider,
    });
  }
}
