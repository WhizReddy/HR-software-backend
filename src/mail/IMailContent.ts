export interface MailContent {
  to: string | string[];
  subject: string;
  template?: string;
  context?: { [key: string]: any };
  html?: string;
}
