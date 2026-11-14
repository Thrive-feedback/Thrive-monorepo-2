import { Module } from '@nestjs/common';
import { GetFeatureFlagsUseCase } from './application/use-cases/get-feature-flags.use-case';
import { FeatureFlagsController } from './presentation/feature-flags.controller';

/**
 * Feature flags answer what a deployment has switched on (ADR 0087). They own no data: every value
 * is read from configuration at boot, so the module depends on nothing but the config layer.
 */
@Module({
  controllers: [FeatureFlagsController],
  providers: [GetFeatureFlagsUseCase],
})
export class FeatureFlagsModule {}
