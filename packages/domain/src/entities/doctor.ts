import { DomainError } from "../errors";

export class InvalidSlotDurationError extends DomainError {
  readonly code = "INVALID_SLOT_DURATION";

  constructor(duration: number) {
    super(
      `Slot duration must be between ${MIN_SLOT_DURATION} and ${MAX_SLOT_DURATION} minutes, got ${duration}`,
    );
  }
}

const MIN_SLOT_DURATION = 15;
const MAX_SLOT_DURATION = 120;

export interface DoctorProps {
  id: string;
  userId: string;
  clinicId: string;
  specialization: string;
  slotDurationMin: number;
  maxDailyAppointments: number;
  googleCalendarId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Doctor {
  readonly id: string;
  readonly userId: string;
  readonly clinicId: string;
  private _specialization: string;
  private _slotDurationMin: number;
  private _maxDailyAppointments: number;
  private _googleCalendarId?: string;
  readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: DoctorProps) {
    Doctor.validateSlotDuration(props.slotDurationMin);
    this.id = props.id;
    this.userId = props.userId;
    this.clinicId = props.clinicId;
    this._specialization = props.specialization;
    this._slotDurationMin = props.slotDurationMin;
    this._maxDailyAppointments = props.maxDailyAppointments;
    this._googleCalendarId = props.googleCalendarId;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  get specialization(): string {
    return this._specialization;
  }

  get slotDurationMin(): number {
    return this._slotDurationMin;
  }

  get maxDailyAppointments(): number {
    return this._maxDailyAppointments;
  }

  get googleCalendarId(): string | undefined {
    return this._googleCalendarId;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateProfile(
    props: Partial<{
      specialization: string;
      slotDurationMin: number;
      maxDailyAppointments: number;
    }>,
  ): void {
    if (props.slotDurationMin !== undefined) {
      Doctor.validateSlotDuration(props.slotDurationMin);
      this._slotDurationMin = props.slotDurationMin;
    }
    if (props.specialization !== undefined)
      this._specialization = props.specialization;
    if (props.maxDailyAppointments !== undefined)
      this._maxDailyAppointments = props.maxDailyAppointments;
    this._updatedAt = new Date();
  }

  connectGoogleCalendar(calendarId: string): void {
    this._googleCalendarId = calendarId;
    this._updatedAt = new Date();
  }

  disconnectGoogleCalendar(): void {
    this._googleCalendarId = undefined;
    this._updatedAt = new Date();
  }

  private static validateSlotDuration(duration: number): void {
    if (duration < MIN_SLOT_DURATION || duration > MAX_SLOT_DURATION) {
      throw new InvalidSlotDurationError(duration);
    }
  }
}
