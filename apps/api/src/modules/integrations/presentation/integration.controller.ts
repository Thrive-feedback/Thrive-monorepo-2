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
  Put,
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
import { BeginInstallUseCase } from '../application/use-cases/begin-install.use-case';
import { ChooseChannelUseCase } from '../application/use-cases/choose-channel.use-case';
import { CompleteInstallUseCase } from '../application/use-cases/complete-install.use-case';
import { DisconnectIntegrationUseCase } from '../application/use-cases/disconnect-integration.use-case';
import { ListConnectionsUseCase } from '../application/use-cases/list-connections.use-case';
import {
  BeginInstallResponseDto,
  ChooseChannelRequestDto,
  CompleteInstallRequestDto,
  CompleteInstallResponseDto,
} from './dto/install-integration.dto';
import {
  ListConnectionsQueryDto,
  ListConnectionsResponseDto,
} from './dto/list-connections.dto';
import {
  IntegrationPathParamsDto,
  WorkspacePathParamsDto,
} from './dto/path-params.dto';
import {
  CurrentWorkspaceAccess,
  type WorkspaceAccess,
  WorkspaceMemberGuard,
} from './workspace-member.guard';

/**
 * One Workspace's Connections to chat tools. Connecting is three steps rather than one, because
 * the tool authorises in between: Thrive answers where to send the Admin, reads back what they
 * authorised, and stores nothing until a message has reached the channel they chose.
 *
 * Who is calling comes from the session and whether they belong here from the guard; neither is
 * ever taken from the body. Whether an Admin is required is each use case's own refusal.
 */
@ApiTags('integrations')
@Controller({ path: 'v1/workspaces/:workspaceId/integrations' })
@UseGuards(WorkspaceMemberGuard)
export class IntegrationController {
  constructor(
    private readonly beginInstallUseCase: BeginInstallUseCase,
    private readonly completeInstallUseCase: CompleteInstallUseCase,
    private readonly chooseChannelUseCase: ChooseChannelUseCase,
    private readonly listConnectionsUseCase: ListConnectionsUseCase,
    private readonly disconnectIntegrationUseCase: DisconnectIntegrationUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'List this Workspace’s connected chat tools, with the channel each posts in',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListConnectionsResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listConnections(
    @CurrentWorkspaceAccess() access: WorkspaceAccess,
    // Declared so the path parameter reaches the contract; the guard has already resolved it.
    @Param() _params: WorkspacePathParamsDto,
    @Query() query: ListConnectionsQueryDto,
  ) {
    const page = { page: query.page, pageSize: query.pageSize };
    const connections = await this.listConnectionsUseCase.execute({
      workspaceId: access.workspaceId,
      page,
    });
    return {
      items: connections.items.map((connection) => ({
        provider: connection.provider,
        externalWorkspaceName: connection.externalWorkspaceName,
        externalChannelName: connection.externalChannelName,
        connectedByAccountId: connection.connectedByAccountId,
        connectedAt: connection.connectedAt.toISOString(),
      })),
      total: connections.total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  @Post(':provider/install')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Begin connecting a chat tool: answer where to send the Admin to authorise Thrive',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: BeginInstallResponseDto })
  @ApiBadRequestResponse({
    description: 'REQUEST_INVALID or PROVIDER_NOT_SUPPORTED',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({ description: 'NOT_ALLOWED_TO_MANAGE_INTEGRATIONS' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async beginInstall(
    @CurrentActor() actor: Actor,
    @CurrentWorkspaceAccess() access: WorkspaceAccess,
    @Param() params: IntegrationPathParamsDto,
  ) {
    return this.beginInstallUseCase.execute({
      workspaceId: access.workspaceId,
      accountId: actor.accountId,
      provider: params.provider,
      isAdmin: access.isAdmin,
    });
  }

  @Post(':provider/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Finish authorising: read back what the tool says was authorised, and offer its channels',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: CompleteInstallResponseDto })
  @ApiBadRequestResponse({
    description:
      'REQUEST_INVALID, PROVIDER_NOT_SUPPORTED or INSTALL_STATE_INVALID',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({ description: 'NOT_ALLOWED_TO_MANAGE_INTEGRATIONS' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  @ApiConflictResponse({ description: 'INSTALL_REFUSED' })
  async completeInstall(
    @CurrentActor() actor: Actor,
    @CurrentWorkspaceAccess() access: WorkspaceAccess,
    @Param() params: IntegrationPathParamsDto,
    @Body() body: CompleteInstallRequestDto,
  ) {
    const install = await this.completeInstallUseCase.execute({
      workspaceId: access.workspaceId,
      accountId: actor.accountId,
      provider: params.provider,
      isAdmin: access.isAdmin,
      code: body.code,
      state: body.state,
    });
    return {
      externalWorkspaceName: install.externalWorkspaceName,
      channels: install.channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
      })),
      installation: install.installation,
    };
  }

  @Put(':provider/channel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Choose the channel this Workspace posts in, which is stored once a message has arrived in it',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({
    description: 'The channel is connected and has been posted in',
  })
  @ApiBadRequestResponse({
    description:
      'REQUEST_INVALID, PROVIDER_NOT_SUPPORTED, INSTALL_STATE_INVALID or CHANNEL_NOT_OFFERED',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({ description: 'NOT_ALLOWED_TO_MANAGE_INTEGRATIONS' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  @ApiConflictResponse({
    description: 'INSTALL_REFUSED or CHANNEL_UNREACHABLE',
  })
  async chooseChannel(
    @CurrentActor() actor: Actor,
    @CurrentWorkspaceAccess() access: WorkspaceAccess,
    @Param() params: IntegrationPathParamsDto,
    @Body() body: ChooseChannelRequestDto,
  ): Promise<void> {
    await this.chooseChannelUseCase.execute({
      workspaceId: access.workspaceId,
      accountId: actor.accountId,
      provider: params.provider,
      isAdmin: access.isAdmin,
      installation: body.installation,
      channelId: body.channelId,
    });
  }

  @Delete(':provider')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Disconnect a chat tool: Thrive leaves the space and forgets the Connection',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({
    description: 'The Connection is gone and Thrive has left the space',
  })
  @ApiBadRequestResponse({
    description: 'REQUEST_INVALID or PROVIDER_NOT_SUPPORTED',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({ description: 'NOT_ALLOWED_TO_MANAGE_INTEGRATIONS' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or CONNECTION_NOT_FOUND',
  })
  async disconnectIntegration(
    @CurrentWorkspaceAccess() access: WorkspaceAccess,
    @Param() params: IntegrationPathParamsDto,
  ): Promise<void> {
    await this.disconnectIntegrationUseCase.execute({
      workspaceId: access.workspaceId,
      provider: params.provider,
      isAdmin: access.isAdmin,
    });
  }
}
