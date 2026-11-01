import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import { toCursor } from '@app/shared/presentation/dto/page.dto';
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
import type { ReceivedItemView } from '../application/types/received-item.types';
import { ListReceivedItemsUseCase } from '../application/use-cases/list-received-items.use-case';
import {
  toAnswerPostcardResponse,
  toFeedbackResponse,
  toFeedItemRequestResponse,
  toKudosResponse,
  toPostcardResponse,
} from './dto/feedback-response.mapper';
import {
  ListReceivedItemsQueryDto,
  ListReceivedItemsResponseDto,
} from './dto/list-received-items.dto';
import { WorkspacePathParamsDto } from './dto/path-params.dto';
import { WorkspaceMemberGuard } from './workspace-member.guard';

function toReceivedItemResponse(item: ReceivedItemView) {
  if (item.kind === 'KUDOS') {
    return { kind: item.kind, ...toKudosResponse(item) };
  }
  return {
    kind: item.kind,
    ...toFeedbackResponse(item),
    visibility: item.visibility,
    postcard: toPostcardResponse(item.postcard),
    request: item.request && {
      ...toFeedItemRequestResponse(item.request),
      postcard: toPostcardResponse(item.request.postcard),
      answerPostcard: toAnswerPostcardResponse(item.request.answerPostcard),
    },
  };
}

/**
 * What was written to the signed-in Member, as one list paged by one cursor (ADR 0059, ADR 0080).
 *
 * Who the caller is comes from the session, so there is no parameter on this route that could name
 * somebody else and read what was written to them.
 */
@ApiTags('feedback')
@Controller({ path: 'v1/workspaces/:workspaceId/received-items' })
@UseGuards(WorkspaceMemberGuard)
export class ReceivedItemsController {
  constructor(
    private readonly listReceivedItemsUseCase: ListReceivedItemsUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List the Feedback and Kudos written to the caller',
  })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.OK, type: ListReceivedItemsResponseDto })
  @ApiBadRequestResponse({ description: 'REQUEST_INVALID' })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiNotFoundResponse({ description: 'WORKSPACE_NOT_FOUND' })
  async listReceivedItems(
    @CurrentActor() actor: Actor,
    @Param() params: WorkspacePathParamsDto,
    @Query() query: ListReceivedItemsQueryDto,
  ) {
    const received = await this.listReceivedItemsUseCase.execute({
      workspaceId: params.workspaceId,
      receiverAccountId: actor.accountId,
      page: { afterId: query.cursor, limit: query.limit },
    });
    return {
      readerAccountId: actor.accountId,
      items: received.items.map(toReceivedItemResponse),
      nextCursor: toCursor(received.nextAfterId),
    };
  }
}
