export interface BookAppointmentDTO {
  readonly clinicId: string;
  readonly doctorId: string;
  readonly patientId: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly reason?: string;
}

export interface CancelAppointmentDTO {
  readonly clinicId: string;
  readonly appointmentId: string;
  readonly cancelledBy: string;
  readonly reason?: string;
}

export interface AppointmentResponseDTO {
  readonly id: string;
  readonly clinicId: string;
  readonly doctorId: string;
  readonly patientId: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly status: string;
  readonly reason?: string;
  readonly cancellationReason?: string;
  readonly cancelledBy?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly patientName?: string;
  readonly doctorName?: string;
}

export interface SlotResponseDTO {
  readonly startsAt: string;
  readonly endsAt: string;
  readonly isAvailable: boolean;
}

export interface AppointmentListFiltersDTO {
  readonly status?: string;
  readonly doctorId?: string;
  readonly patientId?: string;
  readonly fromDate?: string;
  readonly toDate?: string;
}
