import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import * as path from 'path';

export const MailerConfig = MailerModule.forRoot({
  transport: {
    host: process.env.MAIL_SERVER,
    port: parseInt(process.env.MAIL_PORT, 10),
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  },
  defaults: {
    from: `"No Reply" <${process.env.MAIL_FROM}>`,
  },
  template: {
    dir: path.join(__dirname, '../common/template'),
    adapter: new HandlebarsAdapter(),
    options: {
      strict: true,
    },
  },
});
