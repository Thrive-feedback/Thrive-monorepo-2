import { AI_SETTING, type AiSetting } from '@app/config/configuration';
import {
  AI_IS_CONFIGURED,
  AiCompleter,
} from '@app/shared/application/ai-completer.port';
import { Module } from '@nestjs/common';
import { AiNotConfigured } from './ai-not-configured.adapter';
import { OpenAiCompatibleAiCompleter } from './openai-compatible-ai-completer.adapter';

/**
 * Binds {@link AiCompleter} to whichever endpoint the environment names, or to nothing at all
 * where it names none (ADR 0085). Mirrors `infrastructure/email/email.module.ts`: the credential
 * is read here, and nothing above this module holds it or knows which provider answers.
 *
 * One binding and no registry: a second adapter arrives when a provider that cannot speak this
 * protocol does, and an abstraction over one implementation is a guess (`GEN_16`).
 */
@Module({
  providers: [
    {
      provide: AiCompleter,
      useFactory: (ai: AiSetting): AiCompleter =>
        ai === null
          ? new AiNotConfigured()
          : new OpenAiCompatibleAiCompleter(
              ai.endpoint,
              ai.apiKey,
              ai.model,
              ai.label,
            ),
      inject: [AI_SETTING],
    },
    {
      // Whether anything may ask a model at all. A feature reads this and does nothing when it
      // is false; it never reads the provider's values, which stay inside this module.
      provide: AI_IS_CONFIGURED,
      useFactory: (ai: AiSetting): boolean => ai !== null,
      inject: [AI_SETTING],
    },
  ],
  exports: [AiCompleter, AI_IS_CONFIGURED],
})
export class AiModule {}
