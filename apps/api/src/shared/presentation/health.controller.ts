import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { HealthResponseDto } from './dto/health.dto';

/**
 * Liveness only: it answers if the process is up and serving, and it touches nothing
 * else. It belongs to no capability, and it sits outside the versioned API because a
 * platform's probe is not part of the contract the web app consumes.
 */
@ApiTags('health')
@Controller({ path: 'health' })
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Report that the API is up' })
  @ZodResponse({ status: HttpStatus.OK, type: HealthResponseDto })
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
