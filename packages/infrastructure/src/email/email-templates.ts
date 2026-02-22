export const EMAIL_TEMPLATE_IDS = {
  APPOINTMENT_CONFIRMATION: "appointment-confirmation",
  APPOINTMENT_CANCELLATION: "appointment-cancellation",
  APPOINTMENT_REMINDER_24H: "appointment-reminder-24h",
} as const;

export type EmailTemplateId =
  (typeof EMAIL_TEMPLATE_IDS)[keyof typeof EMAIL_TEMPLATE_IDS];

export interface TemplateVariables {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  clinicName: string;
  reason?: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const templates: Record<
  EmailTemplateId,
  (vars: TemplateVariables) => RenderedEmail
> = {
  [EMAIL_TEMPLATE_IDS.APPOINTMENT_CONFIRMATION]: (vars) => ({
    subject: `Appointment Confirmed – ${vars.date} at ${vars.time}`,
    html: [
      `<h2>Appointment Confirmation</h2>`,
      `<p>Dear ${vars.patientName},</p>`,
      `<p>Your appointment with Dr. ${vars.doctorName} at <strong>${vars.clinicName}</strong> has been confirmed.</p>`,
      `<p><strong>Date:</strong> ${vars.date}<br/><strong>Time:</strong> ${vars.time}</p>`,
      vars.reason ? `<p><strong>Reason:</strong> ${vars.reason}</p>` : "",
      `<p>Please arrive 10 minutes early.</p>`,
    ].join("\n"),
    text: [
      `Appointment Confirmation`,
      ``,
      `Dear ${vars.patientName},`,
      `Your appointment with Dr. ${vars.doctorName} at ${vars.clinicName} has been confirmed.`,
      `Date: ${vars.date}`,
      `Time: ${vars.time}`,
      vars.reason ? `Reason: ${vars.reason}` : "",
      `Please arrive 10 minutes early.`,
    ]
      .filter(Boolean)
      .join("\n"),
  }),

  [EMAIL_TEMPLATE_IDS.APPOINTMENT_CANCELLATION]: (vars) => ({
    subject: `Appointment Cancelled – ${vars.date} at ${vars.time}`,
    html: [
      `<h2>Appointment Cancelled</h2>`,
      `<p>Dear ${vars.patientName},</p>`,
      `<p>Your appointment with Dr. ${vars.doctorName} at <strong>${vars.clinicName}</strong> on ${vars.date} at ${vars.time} has been cancelled.</p>`,
      vars.reason
        ? `<p><strong>Reason:</strong> ${vars.reason}</p>`
        : "",
      `<p>Please contact us to reschedule.</p>`,
    ].join("\n"),
    text: [
      `Appointment Cancelled`,
      ``,
      `Dear ${vars.patientName},`,
      `Your appointment with Dr. ${vars.doctorName} at ${vars.clinicName} on ${vars.date} at ${vars.time} has been cancelled.`,
      vars.reason ? `Reason: ${vars.reason}` : "",
      `Please contact us to reschedule.`,
    ]
      .filter(Boolean)
      .join("\n"),
  }),

  [EMAIL_TEMPLATE_IDS.APPOINTMENT_REMINDER_24H]: (vars) => ({
    subject: `Reminder: Appointment Tomorrow – ${vars.date} at ${vars.time}`,
    html: [
      `<h2>Appointment Reminder</h2>`,
      `<p>Dear ${vars.patientName},</p>`,
      `<p>This is a reminder that you have an appointment with Dr. ${vars.doctorName} at <strong>${vars.clinicName}</strong> tomorrow.</p>`,
      `<p><strong>Date:</strong> ${vars.date}<br/><strong>Time:</strong> ${vars.time}</p>`,
      vars.reason ? `<p><strong>Reason:</strong> ${vars.reason}</p>` : "",
      `<p>Please arrive 10 minutes early.</p>`,
    ].join("\n"),
    text: [
      `Appointment Reminder`,
      ``,
      `Dear ${vars.patientName},`,
      `This is a reminder that you have an appointment with Dr. ${vars.doctorName} at ${vars.clinicName} tomorrow.`,
      `Date: ${vars.date}`,
      `Time: ${vars.time}`,
      vars.reason ? `Reason: ${vars.reason}` : "",
      `Please arrive 10 minutes early.`,
    ]
      .filter(Boolean)
      .join("\n"),
  }),
};

const VALID_TEMPLATE_IDS = new Set<string>(Object.values(EMAIL_TEMPLATE_IDS));

export function renderTemplate(
  templateId: string,
  variables: TemplateVariables,
): RenderedEmail {
  if (!VALID_TEMPLATE_IDS.has(templateId)) {
    throw new Error(`Unknown email template: ${templateId}`);
  }

  return templates[templateId as EmailTemplateId](variables);
}
