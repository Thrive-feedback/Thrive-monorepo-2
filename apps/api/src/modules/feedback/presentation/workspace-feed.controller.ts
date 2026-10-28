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
  ApiBadRequestResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ListWorkspaceFeedUseCase } from '../application/use-cases/list-workspace-feed.use-case';
import {
  toFeedbackResponse,
  toPersonResponse,
  toTagsResponse,
} from './dto/feedback-response.mapper';
import {
  ListWorkspaceFeedQueryDto,
  ListWorkspaceFeedResponseDto,
} from './dto/list-workspace-feed.dto';
import { WorkspacePathParamsDto } from './dto/path-params.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

/**
 * The Workspace feed: the Feedback people chose to show everybody they work with.
 *
 * **The only Feedback route with no person in its read.** It answers every Member of the
 * Workspace the same thing, so `WorkspaceMemberGuard` is the whole of its authorization —
 * a stranger is told the Workspace does not exist, and that refusal is the one this route
 * cannot afford to lose.
 */
@ApiTags('feedback')
@Controller({ path: 'v1/workspaces/:workspaceId/feed' })
@UseGuards(WorkspaceMemberGuard)
export class WorkspaceFeedController {
  constructor(
    private readonly listWorkspaceFeedUseCase: ListWorkspaceFeedUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List the Feedback shared with everyone in this Workspace',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListWorkspaceFeedResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listWorkspaceFeed(
    @Param() params: WorkspacePathParamsDto,
    @Query() query: ListWorkspaceFeedQueryDto,
  ) {
    const page = { page: query.page, pageSize: query.pageSize };
    const feed = await this.listWorkspaceFeedUseCase.execute({
      workspaceId: params.workspaceId,
      page,
    });
    return {
      items: feed.items.map((feedback) => ({
        ...toFeedbackResponse(feedback),
        request: feedback.request && {
          message: feedback.request.message,
          tags: toTagsResponse(feedback.request.tags),
          requester: toPersonResponse(feedback.request.requester),
          asked: feedback.request.asked.map(toPersonResponse),
        },
      })),
      total: feed.total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }
}
