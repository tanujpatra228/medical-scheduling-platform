import type { IEmailPort, EmailPayload } from "@msp/application";
import { renderTemplate, type TemplateVariables } from "./email-templates";

interface SentEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  templateId: string;
  variables: Record<string, string>;
  sentAt: Date;
}

export class ConsoleEmailAdapter implements IEmailPort {
  private readonly sentEmails: SentEmail[] = [];

  async send(payload: EmailPayload): Promise<void> {
    const rendered = renderTemplate(
      payload.templateId,
      payload.variables as unknown as TemplateVariables,
    );

    const sentEmail: SentEmail = {
      to: payload.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      templateId: payload.templateId,
      variables: payload.variables,
      sentAt: new Date(),
    };

    this.sentEmails.push(sentEmail);

    console.log(
      `[Email] To: ${payload.to} | Subject: ${rendered.subject} | Template: ${payload.templateId}`,
    );
  }

  getSentEmails(): readonly SentEmail[] {
    return this.sentEmails;
  }

  clearSentEmails(): void {
    this.sentEmails.length = 0;
  }
}
