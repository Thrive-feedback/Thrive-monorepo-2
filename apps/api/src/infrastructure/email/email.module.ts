import { EmailConfig } from '@app/config/configuration';
import { EmailSender } from '@app/shared/application/email-sender.port';
import { Module } from '@nestjs/common';
import { GmailSmtpEmailSender } from './gmail-smtp-email-sender.adapter';

/** Binds {@link EmailSender} to Gmail, as the account the environment names (ADR 0036). */
@Module({
  providers: [
    {
      provide: EmailSender,
      useFactory: (emailConfig: EmailConfig): EmailSender =>
        new GmailSmtpEmailSender(
          emailConfig.gmailUser,
          emailConfig.gmailAppPassword,
        ),
      inject: [EmailConfig],
    },
  ],
  exports: [EmailSender],
})
export class EmailModule {}
