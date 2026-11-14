import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import { Controller, Get, HttpStatus } from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import type { z } from 'zod';
import { GetMyUiShowcaseAccessUseCase } from '../application/use-cases/get-my-ui-showcase-access.use-case';
import {
  GetMyUiShowcaseAccessResponseDto,
  type getMyUiShowcaseAccessResponseSchema,
} from './dto/get-my-ui-showcase-access.dto';

/**
 * Whether the signed-in caller may open the UI showcase (ADR 0088). The caller is the session, so
 * the route cannot be asked about anybody else, and someone signed out is refused before it runs.
 */
@ApiTags('ui-showcase-access')
@Controller({ path: 'v1/ui-showcase-access/mine' })
export class UiShowcaseAccessController {
  constructor(
    private readonly getMyUiShowcaseAccessUseCase: GetMyUiShowcaseAccessUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Read whether I may open the UI showcase' })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({
    status: HttpStatus.OK,
    type: GetMyUiShowcaseAccessResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  getMine(
    @CurrentActor() actor: Actor,
  ): z.infer<typeof getMyUiShowcaseAccessResponseSchema> {
    const access = this.getMyUiShowcaseAccessUseCase.execute({
      email: actor.email,
    });
    return { isAllowed: access.isAllowed };
  }
}
