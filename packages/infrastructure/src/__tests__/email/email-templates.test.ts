import { describe, it, expect } from "vitest";
import {
  renderTemplate,
  EMAIL_TEMPLATE_IDS,
  type TemplateVariables,
} from "../../email/email-templates";

const baseVariables: TemplateVariables = {
  patientName: "John Doe",
  doctorName: "Jane Smith",
  date: "Monday, January 20, 2025",
  time: "10:00 AM",
  clinicName: "HealthFirst Clinic",
};

describe("renderTemplate", () => {
  it("should render appointment-confirmation template", () => {
    const result = renderTemplate(
      EMAIL_TEMPLATE_IDS.APPOINTMENT_CONFIRMATION,
      baseVariables,
    );

    expect(result.subject).toContain("Appointment Confirmed");
    expect(result.subject).toContain(baseVariables.date);
    expect(result.html).toContain(baseVariables.patientName);
    expect(result.html).toContain(baseVariables.doctorName);
    expect(result.html).toContain(baseVariables.clinicName);
    expect(result.text).toContain(baseVariables.patientName);
    expect(result.text).toContain(baseVariables.doctorName);
  });

  it("should render appointment-cancellation template", () => {
    const result = renderTemplate(
      EMAIL_TEMPLATE_IDS.APPOINTMENT_CANCELLATION,
      baseVariables,
    );

    expect(result.subject).toContain("Appointment Cancelled");
    expect(result.html).toContain(baseVariables.patientName);
    expect(result.html).toContain("reschedule");
    expect(result.text).toContain(baseVariables.patientName);
  });

  it("should render appointment-reminder-24h template", () => {
    const result = renderTemplate(
      EMAIL_TEMPLATE_IDS.APPOINTMENT_REMINDER_24H,
      baseVariables,
    );

    expect(result.subject).toContain("Reminder");
    expect(result.html).toContain("reminder");
    expect(result.html).toContain(baseVariables.doctorName);
    expect(result.text).toContain("reminder");
  });

  it("should include reason when provided", () => {
    const vars: TemplateVariables = { ...baseVariables, reason: "Annual checkup" };

    const result = renderTemplate(
      EMAIL_TEMPLATE_IDS.APPOINTMENT_CONFIRMATION,
      vars,
    );

    expect(result.html).toContain("Annual checkup");
    expect(result.text).toContain("Annual checkup");
  });

  it("should omit reason section when not provided", () => {
    const result = renderTemplate(
      EMAIL_TEMPLATE_IDS.APPOINTMENT_CONFIRMATION,
      baseVariables,
    );

    expect(result.html).not.toContain("Reason:");
  });

  it("should throw on unknown template ID", () => {
    expect(() =>
      renderTemplate("unknown-template", baseVariables),
    ).toThrow("Unknown email template: unknown-template");
  });
});
