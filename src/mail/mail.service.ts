import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { MailContent } from './IMailContent';

@Injectable()
export class MailService {
  constructor(private readonly mailService: MailerService) {}

  async sendMail(dataMailer: MailContent): Promise<void> {
    await this.mailService.sendMail({
      from: process.env.MAIL_SENDER,
      to: dataMailer.to,
      subject: dataMailer.subject,
      template: dataMailer.template,
      context: dataMailer.context,
      html: dataMailer.html,
    });
  }
}
