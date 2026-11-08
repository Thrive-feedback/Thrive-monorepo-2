import { AiConfig } from '@app/config/configuration';
import { AiCompleter } from '@app/shared/application/ai-completer.port';
import { Module } from '@nestjs/common';
import { OpenAiCompatibleAiCompleter } from './openai-compatible-ai-completer.adapter';

/**
 * Binds {@link AiCompleter} to whichever endpoint the environment names. Mirrors
 * `infrastructure/email/email.module.ts`: the credential is read here, and nothing above this
 * module holds it or knows which provider answers (ADR 0077).
 *
 * One binding and no registry: a second adapter arrives when a provider that cannot speak this
 * protocol does, and an abstraction over one implementation is a guess (`GEN_16`).
 */
@Module({
  providers: [
    {
      provide: AiCompleter,
      useFactory: (aiConfig: AiConfig): AiCompleter =>
        new OpenAiCompatibleAiCompleter(
          aiConfig.endpoint,
          aiConfig.apiKey,
          aiConfig.model,
          aiConfig.label,
        ),
      inject: [AiConfig],
    },
  ],
  exports: [AiCompleter],
})
export class AiModule {}
