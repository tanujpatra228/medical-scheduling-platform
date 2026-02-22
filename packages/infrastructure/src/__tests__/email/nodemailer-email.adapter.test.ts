import { describe, it, expect, vi, beforeEach } from "vitest";
import { NodemailerEmailAdapter } from "../../email/nodemailer-email.adapter";
import type { SmtpConfig } from "../../email/nodemailer-email.adapter";

vi.mock("nodemailer", () => {
  const sendMail = vi.fn().mockResolvedValue({ messageId: "test-id" });
  return {
    default: {
      createTransport: vi.fn().mockReturnValue({ sendMail }),
    },
    __sendMail: sendMail,
  };
});

import nodemailer from "nodemailer";

const smtpConfig: SmtpConfig = {
  host: "localhost",
  port: 1025,
  secure: false,
  from: "test@msp.local",
};

describe("NodemailerEmailAdapter", () => {
  let adapter: NodemailerEmailAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new NodemailerEmailAdapter(smtpConfig);
  });

  it("should create a nodemailer transport with config", () => {
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: "localhost",
      port: 1025,
      secure: false,
    });
  });

  it("should create transport with auth when provided", () => {
    vi.clearAllMocks();
    new NodemailerEmailAdapter({
      ...smtpConfig,
      auth: { user: "user", pass: "pass" },
    });

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: "localhost",
      port: 1025,
      secure: false,
      auth: { user: "user", pass: "pass" },
    });
  });

  it("should send email with rendered template", async () => {
    await adapter.send({
      to: "patient@example.com",
      subject: "",
      templateId: "appointment-confirmation",
      variables: {
        patientName: "John Doe",
        doctorName: "Jane Smith",
        date: "Monday, January 20, 2025",
        time: "10:00 AM",
        clinicName: "Test Clinic",
      },
    });

    const transport = (nodemailer.createTransport as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(transport.sendMail).toHaveBeenCalledTimes(1);

    const callArgs = transport.sendMail.mock.calls[0][0];
    expect(callArgs.from).toBe("test@msp.local");
    expect(callArgs.to).toBe("patient@example.com");
    expect(callArgs.subject).toContain("Appointment Confirmed");
    expect(callArgs.html).toContain("John Doe");
    expect(callArgs.text).toContain("John Doe");
  });
});
