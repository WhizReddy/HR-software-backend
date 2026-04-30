import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Handlebars from 'handlebars';
import { promises as fs } from 'fs';
import nodemailer, { Transporter } from 'nodemailer';
import { join } from 'path';
import { MailContent } from './IMailContent';

@Injectable()
export class MailService {
  private readonly templateCache = new Map<
    string,
    Handlebars.TemplateDelegate<Record<string, any>>
  >();
  private smtpTransporter?: Transporter;

  constructor(private readonly configService: ConfigService) {}

  async sendMail(dataMailer: MailContent): Promise<void> {
    const html =
      dataMailer.html ??
      (dataMailer.template
        ? await this.renderTemplate(
            dataMailer.template,
            dataMailer.context ?? {},
          )
        : undefined);

    if (!html) {
      throw new Error('Email content is required');
    }

    const payload = {
      from: this.getFromAddress(),
      to: Array.isArray(dataMailer.to) ? dataMailer.to : [dataMailer.to],
      subject: dataMailer.subject,
      html,
    };

    if (this.configService.get<string>('BREVO_API_KEY')) {
      await this.sendWithBrevo(payload);
      return;
    }

    if (this.configService.get<string>('RESEND_API_KEY')) {
      await this.sendWithResend(payload);
      return;
    }

    await this.sendWithSmtp(payload);
  }

  private async renderTemplate(
    templateName: string,
    context: Record<string, any>,
  ): Promise<string> {
    const compiledTemplate = await this.loadTemplate(templateName);
    return compiledTemplate(context);
  }

  private async loadTemplate(
    templateName: string,
  ): Promise<Handlebars.TemplateDelegate<Record<string, any>>> {
    const cachedTemplate = this.templateCache.get(templateName);
    if (cachedTemplate) {
      return cachedTemplate;
    }

    const templatePath = await this.resolveTemplatePath(templateName);
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const compiledTemplate =
      Handlebars.compile<Record<string, any>>(templateSource);

    this.templateCache.set(templateName, compiledTemplate);
    return compiledTemplate;
  }

  private async resolveTemplatePath(templateName: string): Promise<string> {
    const fileName = `${templateName}.hbs`;
    const templateDirectories = [
      join(process.cwd(), 'dist/common/template'),
      join(process.cwd(), 'src/common/template'),
      join(__dirname, '../common/template'),
      join(__dirname, '../src/common/template'),
    ];

    for (const directory of templateDirectories) {
      const templatePath = join(directory, fileName);

      try {
        await fs.access(templatePath);
        return templatePath;
      } catch {
        continue;
      }
    }

    throw new Error(`Email template not found: ${fileName}`);
  }

  private async sendWithResend(payload: {
    from: string;
    to: string[];
    subject: string;
    html: string;
  }): Promise<void> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      return;
    }

    const responseText = await response.text();
    let errorMessage = responseText;

    try {
      const parsedResponse = JSON.parse(responseText) as {
        message?: string;
        name?: string;
      };
      errorMessage =
        parsedResponse.message ??
        parsedResponse.name ??
        response.statusText ??
        'Unknown Resend error';
    } catch {
      errorMessage = responseText || response.statusText;
    }

    throw new Error(
      `Resend request failed (${response.status}): ${errorMessage}`,
    );
  }

  private async sendWithBrevo(payload: {
    from: string;
    to: string[];
    subject: string;
    html: string;
  }): Promise<void> {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    const senderEmail =
      this.configService.get<string>('BREVO_SENDER_EMAIL') ??
      this.configService.get<string>('MAIL_SENDER');

    if (!senderEmail) {
      throw new Error(
        'BREVO_SENDER_EMAIL is not configured. Add a verified sender email in Brevo and set it in your environment.',
      );
    }

    const senderName =
      this.configService.get<string>('BREVO_SENDER_NAME') ?? 'HR Platform';

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: payload.to.map((email) => ({ email })),
        subject: payload.subject,
        htmlContent: payload.html,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      return;
    }

    const responseText = await response.text();
    let errorMessage = responseText;

    try {
      const parsedResponse = JSON.parse(responseText) as {
        message?: string;
        code?: string;
      };
      errorMessage =
        parsedResponse.message ??
        parsedResponse.code ??
        response.statusText ??
        'Unknown Brevo error';
    } catch {
      errorMessage = responseText || response.statusText;
    }

    throw new Error(
      `Brevo request failed (${response.status}): ${errorMessage}`,
    );
  }

  private async sendWithSmtp(payload: {
    from: string;
    to: string[];
    subject: string;
    html: string;
  }): Promise<void> {
    const transporter = this.getSmtpTransporter();

    await transporter.sendMail({
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
  }

  private getSmtpTransporter(): Transporter {
    if (this.smtpTransporter) {
      return this.smtpTransporter;
    }

    const host = this.configService.get<string>('MAIL_SERVER');
    const port = Number(this.configService.get<string>('MAIL_PORT'));
    const user = this.configService.get<string>('MAIL_USERNAME');
    const pass = this.configService.get<string>('MAIL_PASSWORD');

    if (!host || !port || !user || !pass) {
      throw new Error(
        'SMTP mail is not configured. Set BREVO_API_KEY or RESEND_API_KEY for free-tier email delivery or provide MAIL_* SMTP settings.',
      );
    }

    this.smtpTransporter = nodemailer.createTransport({
      host,
      secure: port === 465,
      port,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user,
        pass,
      },
    });

    return this.smtpTransporter;
  }

  private getFromAddress(): string {
    return (
      this.configService.get<string>('BREVO_SENDER_EMAIL') ??
      this.configService.get<string>('RESEND_FROM') ??
      this.configService.get<string>('MAIL_SENDER') ??
      'onboarding@resend.dev'
    );
  }
}
