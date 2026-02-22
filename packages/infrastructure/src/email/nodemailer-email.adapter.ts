import nodemailer, { type Transporter } from "nodemailer";
import type { IEmailPort, EmailPayload } from "@msp/application";
import { renderTemplate, type TemplateVariables } from "./email-templates";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
  from: string;
}

export class NodemailerEmailAdapter implements IEmailPort {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(smtpConfig: SmtpConfig) {
    this.from = smtpConfig.from;
    this.transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      ...(smtpConfig.auth ? { auth: smtpConfig.auth } : {}),
    });
  }

  async send(payload: EmailPayload): Promise<void> {
    const rendered = renderTemplate(
      payload.templateId,
      payload.variables as unknown as TemplateVariables,
    );

    await this.transporter.sendMail({
      from: this.from,
      to: payload.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }
}
