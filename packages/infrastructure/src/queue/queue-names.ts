export const QUEUE_NAMES = {
  EMAIL_DISPATCH: "email-dispatch",
  APPOINTMENT_REMINDERS: "appointment-reminders",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
