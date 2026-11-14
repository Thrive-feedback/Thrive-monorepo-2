import { Module } from '@nestjs/common';
import { GetMyUiShowcaseAccessUseCase } from './application/use-cases/get-my-ui-showcase-access.use-case';
import { UiShowcaseAccessController } from './presentation/ui-showcase-access.controller';

/**
 * Who may open the web's UI showcase (ADR 0088). It owns no data: the list is configuration read
 * at boot, and the caller is the session the global guard already checked.
 */
@Module({
  controllers: [UiShowcaseAccessController],
  providers: [GetMyUiShowcaseAccessUseCase],
})
export class UiShowcaseAccessModule {}
