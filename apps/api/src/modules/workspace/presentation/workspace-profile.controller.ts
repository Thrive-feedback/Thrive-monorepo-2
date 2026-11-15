import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import { Controller, Get, HttpStatus, Param, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import type { MembershipView } from '../application/types/membership.types';
import { GetWorkspaceProfileUseCase } from '../application/use-cases/get-workspace-profile.use-case';
import { GetWorkspaceProfileResponseDto } from './dto/get-workspace-profile.dto';
import { WorkspaceProfilePathParamsDto } from './dto/workspace-profile-path-params.dto';
import {
  CurrentMembership,
  WorkspaceMemberGuard,
} from './workspace-member.guard';

/** The Profiles of the people in one Workspace, opened by slug by anyone who is a Member of it. */
@ApiTags('workspace')
@Controller({ path: 'v1/workspaces/:workspaceId/profiles' })
@UseGuards(WorkspaceMemberGuard)
export class WorkspaceProfileController {
  constructor(
    private readonly getWorkspaceProfileUseCase: GetWorkspaceProfileUseCase,
  ) {}

  @Get(':slug')
  @ApiOperation({
    summary:
      'Read the Profile of someone who is or was a Member of this Workspace',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: GetWorkspaceProfileResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or PROFILE_NOT_FOUND',
  })
  async getWorkspaceProfile(
    @CurrentMembership() membership: MembershipView,
    @Param() params: WorkspaceProfilePathParamsDto,
  ) {
    const profile = await this.getWorkspaceProfileUseCase.execute({
      membership,
      slug: params.slug,
    });
    return {
      accountId: profile.accountId,
      slug: profile.slug,
      email: profile.email,
      fullName: profile.fullName,
      displayName: profile.displayName,
      photoUrl: profile.photoUrl,
      role: profile.role,
      status: profile.status,
      joinedAt: profile.joinedAt.toISOString(),
    };
  }
}
