import { EmailConfig } from '@app/config/configuration';
import { EmailSender } from '@app/shared/application/email-sender.port';
import { Module } from '@nestjs/common';
import { ResendEmailSender } from './resend-email-sender.adapter';

/** Binds {@link EmailSender} to Resend, as the address the environment names (ADR 0038). */
@Module({
  providers: [
    {
      provide: EmailSender,
      useFactory: (emailConfig: EmailConfig): EmailSender =>
        new ResendEmailSender(
          emailConfig.resendApiKey,
          emailConfig.fromAddress,
        ),
      inject: [EmailConfig],
    },
  ],
  exports: [EmailSender],
})
export class EmailModule {}
