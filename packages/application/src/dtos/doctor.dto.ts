export interface CreateDoctorDTO {
  readonly clinicId: string;
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone?: string;
  readonly specialization: string;
  readonly slotDurationMin: number;
  readonly maxDailyAppointments?: number;
}

export interface UpdateDoctorDTO {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly phone?: string;
  readonly specialization?: string;
  readonly slotDurationMin?: number;
  readonly maxDailyAppointments?: number;
}

export interface DoctorResponseDTO {
  readonly id: string;
  readonly userId: string;
  readonly clinicId: string;
  readonly specialization: string;
  readonly slotDurationMin: number;
  readonly maxDailyAppointments: number | null;
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly phone?: string;
  };
}
