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
import { KeepOneOnOneTemplateUseCase } from '../application/use-cases/templates/keep-one-on-one-template.use-case';
import { ListOneOnOneTemplatesUseCase } from '../application/use-cases/templates/list-one-on-one-templates.use-case';
import { RemoveOneOnOneTemplateUseCase } from '../application/use-cases/templates/remove-one-on-one-template.use-case';
import { RewriteOneOnOneTemplateUseCase } from '../application/use-cases/templates/rewrite-one-on-one-template.use-case';
import {
  KeepOneOnOneTemplateRequestDto,
  KeptOneOnOneTemplateResponseDto,
  ListOneOnOneTemplatesResponseDto,
  OneOnOneTemplatePathParamsDto,
  RewriteOneOnOneTemplateRequestDto,
  WorkspacePathParamsDto,
} from './dto/one-on-one.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

const CONTENT_ERRORS = 'REQUEST_INVALID or ONE_ON_ONE_TEMPLATE_INVALID';
const LAYER_ERRORS =
  'ONE_ON_ONE_TEMPLATE_NAME_TAKEN or ONE_ON_ONE_TEMPLATE_LIMIT_REACHED';

/**
 * The 1:1 templates an agenda can start from, in three layers (brain ADR-0060 §8): Thrive's own,
 * which nobody changes; the Workspace's, which its Admins keep for everyone; and each Member's own,
 * which nobody else sees.
 */
@ApiTags('one-on-ones')
@Controller({ path: 'v1/workspaces/:workspaceId/one-on-one-templates' })
@UseGuards(WorkspaceMemberGuard)
export class OneOnOneTemplateController {
  constructor(
    private readonly listOneOnOneTemplatesUseCase: ListOneOnOneTemplatesUseCase,
    private readonly keepOneOnOneTemplateUseCase: KeepOneOnOneTemplateUseCase,
    private readonly rewriteOneOnOneTemplateUseCase: RewriteOneOnOneTemplateUseCase,
    private readonly removeOneOnOneTemplateUseCase: RemoveOneOnOneTemplateUseCase,
  ) {}

  /**
   * Not paged, by the exception ADR 0096 records to BE_07 R5: each kept layer holds at most
   * `MAX_TEMPLATES_PER_LAYER`, and the dialogs that choose one need every one at once.
   */
  @Get()
  @ApiOperation({
    summary:
      "List the 1:1 templates the caller can start an agenda from: Thrive's, the Workspace's, then their own. Not paged: each layer is capped (ADR 0096)",
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({
    status: HttpStatus.OK,
    type: ListOneOnOneTemplatesResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listOneOnOneTemplates(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
  ) {
    const list = await this.listOneOnOneTemplatesUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
    });
    return {
      items: list.items.map((template) => ({
        key: template.key,
        scope: template.scope,
        name: template.name,
        suggestedWhen: template.suggestedWhen,
        questions: [...template.questions],
        changeable: template.changeable,
      })),
      mayKeepForWorkspace: list.mayKeepForWorkspace,
    };
  }

  @Post()
  @ApiOperation({
    summary:
      'Keep a new 1:1 template: for the caller alone, or, as an Admin, for everyone in the Workspace',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({
    status: HttpStatus.CREATED,
    type: KeptOneOnOneTemplateResponseDto,
  })
  @ApiBadRequestResponse({ description: CONTENT_ERRORS })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({ description: 'ONE_ON_ONE_TEMPLATE_NOT_YOURS' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  @ApiConflictResponse({ description: LAYER_ERRORS })
  async keepOneOnOneTemplate(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Body() body: KeepOneOnOneTemplateRequestDto,
  ) {
    return this.keepOneOnOneTemplateUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      scope: body.scope,
      content: {
        name: body.name,
        suggestedWhen: body.suggestedWhen,
        questions: body.questions,
      },
    });
  }

  @Put(':templateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Replace what a 1:1 template the caller may change says; agendas opened from it later use what it says now',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Rewritten' })
  @ApiBadRequestResponse({ description: CONTENT_ERRORS })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({ description: 'ONE_ON_ONE_TEMPLATE_NOT_YOURS' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or ONE_ON_ONE_TEMPLATE_NOT_FOUND',
  })
  @ApiConflictResponse({ description: LAYER_ERRORS })
  async rewriteOneOnOneTemplate(
    @CurrentActor() actor: Actor,
    @Param() params: OneOnOneTemplatePathParamsDto,
    @Body() body: RewriteOneOnOneTemplateRequestDto,
  ): Promise<void> {
    await this.rewriteOneOnOneTemplateUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      templateId: params.templateId,
      content: {
        name: body.name,
        suggestedWhen: body.suggestedWhen,
        questions: body.questions,
      },
    });
  }

  @Delete(':templateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Remove a 1:1 template the caller may change; the 1:1s starting from it keep its questions',
  })
  @ApiHeader(COOKIE_HEADER)
  @ApiNoContentResponse({ description: 'Removed' })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiForbiddenResponse({ description: 'ONE_ON_ONE_TEMPLATE_NOT_YOURS' })
  @ApiNotFoundResponse({
    description: 'WORKSPACE_NOT_FOUND or ONE_ON_ONE_TEMPLATE_NOT_FOUND',
  })
  async removeOneOnOneTemplate(
    @CurrentActor() actor: Actor,
    @Param() params: OneOnOneTemplatePathParamsDto,
  ): Promise<void> {
    await this.removeOneOnOneTemplateUseCase.execute({
      workspaceId: params.workspaceId,
      accountId: actor.accountId,
      templateId: params.templateId,
    });
  }
}
