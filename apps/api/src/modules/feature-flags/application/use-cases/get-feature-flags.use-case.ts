import { FeatureFlagsConfig } from '@app/config/configuration';
import { Injectable } from '@nestjs/common';

/** What this deployment has switched on, as it was set when the API started. */
export interface FeatureFlags {
  readonly showsDashboard: boolean;
}

/**
 * A query: the flags the web reads to decide what to show (ADR 0087). Each one is set per
 * deployment, so changing one is a redeploy of the API, never a code change.
 */
@Injectable()
export class GetFeatureFlagsUseCase {
  constructor(private readonly featureFlagsConfig: FeatureFlagsConfig) {}

  execute(): FeatureFlags {
    return { showsDashboard: this.featureFlagsConfig.showsDashboard };
  }
}
