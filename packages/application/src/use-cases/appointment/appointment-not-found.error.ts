export class AppointmentNotFoundError extends Error {
  constructor(appointmentId: string) {
    super(`Appointment not found: ${appointmentId}`);
    this.name = "AppointmentNotFoundError";
  }
}
