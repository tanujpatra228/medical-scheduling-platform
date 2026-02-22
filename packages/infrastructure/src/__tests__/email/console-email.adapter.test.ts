import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConsoleEmailAdapter } from "../../email/console-email.adapter";

describe("ConsoleEmailAdapter", () => {
  let adapter: ConsoleEmailAdapter;

  beforeEach(() => {
    adapter = new ConsoleEmailAdapter();
  });

  it("should store sent emails", async () => {
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

    const emails = adapter.getSentEmails();
    expect(emails).toHaveLength(1);
    expect(emails[0].to).toBe("patient@example.com");
    expect(emails[0].templateId).toBe("appointment-confirmation");
    expect(emails[0].subject).toContain("Appointment Confirmed");
  });

  it("should log to console when sending", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await adapter.send({
      to: "test@example.com",
      subject: "",
      templateId: "appointment-cancellation",
      variables: {
        patientName: "John",
        doctorName: "Dr. Smith",
        date: "Jan 20",
        time: "10:00 AM",
        clinicName: "Clinic",
      },
    });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain("[Email]");
    expect(consoleSpy.mock.calls[0][0]).toContain("test@example.com");

    consoleSpy.mockRestore();
  });

  it("should clear sent emails", async () => {
    await adapter.send({
      to: "a@b.com",
      subject: "",
      templateId: "appointment-confirmation",
      variables: {
        patientName: "A",
        doctorName: "B",
        date: "Jan 1",
        time: "9 AM",
        clinicName: "C",
      },
    });

    expect(adapter.getSentEmails()).toHaveLength(1);
    adapter.clearSentEmails();
    expect(adapter.getSentEmails()).toHaveLength(0);
  });

  it("should accumulate multiple emails", async () => {
    const payload = {
      to: "x@y.com",
      subject: "",
      templateId: "appointment-confirmation" as const,
      variables: {
        patientName: "X",
        doctorName: "Y",
        date: "Jan 1",
        time: "9 AM",
        clinicName: "Z",
      },
    };

    await adapter.send(payload);
    await adapter.send({ ...payload, to: "a@b.com" });

    expect(adapter.getSentEmails()).toHaveLength(2);
    expect(adapter.getSentEmails()[0].to).toBe("x@y.com");
    expect(adapter.getSentEmails()[1].to).toBe("a@b.com");
  });
});
