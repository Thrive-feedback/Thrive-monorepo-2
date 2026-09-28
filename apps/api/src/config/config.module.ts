import { Global, Module } from '@nestjs/common';

import {
  CONFIGURATION,
  type Configuration,
  HttpConfig,
  loadConfiguration,
} from './configuration';

/**
 * Configuration is parsed once at boot and handed out as typed values. Global so a module
 * declares a dependency on a namespace, not on this module.
 */
@Global()
@Module({
  providers: [
    { provide: CONFIGURATION, useFactory: () => loadConfiguration() },
    // Each namespace is a projection of the one value parsed above, never a second parse.
    {
      provide: HttpConfig,
      useFactory: (config: Configuration) => config.http,
      inject: [CONFIGURATION],
    },
  ],
  exports: [HttpConfig],
})
export class ConfigModule {}
