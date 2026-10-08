import { type Actor, CurrentActor } from '@app/shared/presentation/actor';
import { COOKIE_HEADER } from '@app/shared/presentation/dto/cookie-header.dto';
import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiHeader,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { CreateProfileUseCase } from '../application/use-cases/create-profile.use-case';
import {
  CreateProfileRequestDto,
  CreateProfileResponseDto,
} from './dto/create-profile.dto';

/** The caller's own Profile. Its slug is made from their email; nobody sends one. */
@ApiTags('profiles')
@Controller({ path: 'v1/profiles' })
export class ProfileController {
  constructor(private readonly createProfileUseCase: CreateProfileUseCase) {}

  @Post()
  @ApiOperation({ summary: "Create the caller's Profile" })
  @ApiHeader(COOKIE_HEADER)
  @ZodResponse({ status: HttpStatus.CREATED, type: CreateProfileResponseDto })
  @ApiBadRequestResponse({
    description:
      'REQUEST_INVALID, FULL_NAME_EMPTY, FULL_NAME_TOO_LONG, DISPLAY_NAME_EMPTY or DISPLAY_NAME_TOO_LONG',
  })
  @ApiUnauthorizedResponse({ description: 'NOT_SIGNED_IN' })
  @ApiConflictResponse({
    description: 'PROFILE_ALREADY_EXISTS, or PROFILE_SLUG_TAKEN after retries',
  })
  async createProfile(
    @CurrentActor() actor: Actor,
    @Body() body: CreateProfileRequestDto,
  ) {
    const created = await this.createProfileUseCase.execute({
      accountId: actor.accountId,
      email: actor.email,
      fullName: body.fullName,
      displayName: body.displayName,
    });
    return { id: created.id };
  }
}
