import { Public } from '@app/shared/presentation/actor';
import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import type { z } from 'zod';
import { GetFeatureFlagsUseCase } from '../application/use-cases/get-feature-flags.use-case';
import {
  GetFeatureFlagsResponseDto,
  type getFeatureFlagsResponseSchema,
} from './dto/get-feature-flags.dto';

/**
 * What this deployment has switched on. Open to anyone, signed in or not: it says only whether a
 * page exists, the same for everybody, and a page outside sign-in may need to ask (ADR 0087).
 * Returning configuration departs from `BE_10` R10 on purpose, and only for the curated booleans
 * `FeatureFlagsConfig` holds — never add a value about where something runs to it.
 */
@Public()
@ApiTags('feature-flags')
@Controller({ path: 'v1/feature-flags' })
export class FeatureFlagsController {
  constructor(
    private readonly getFeatureFlagsUseCase: GetFeatureFlagsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Read what this deployment has switched on' })
  @ZodResponse({ status: HttpStatus.OK, type: GetFeatureFlagsResponseDto })
  getFeatureFlags(): z.infer<typeof getFeatureFlagsResponseSchema> {
    const flags = this.getFeatureFlagsUseCase.execute();
    return { USER_DASHBOARD_FLAG: flags.showsDashboard ? 'true' : 'false' };
  }
}
