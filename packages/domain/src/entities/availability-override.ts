import { DomainError } from "../errors";

export class InvalidAvailabilityOverrideError extends DomainError {
  readonly code = "INVALID_AVAILABILITY_OVERRIDE";

  constructor(message: string) {
    super(message);
  }
}

export interface AvailabilityOverrideProps {
  id: string;
  clinicId: string;
  doctorId: string;
  date: Date;
  startTime?: string; // undefined for full-day off
  endTime?: string; // undefined for full-day off
  isAvailable: boolean;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AvailabilityOverride {
  readonly id: string;
  readonly clinicId: string;
  readonly doctorId: string;
  readonly date: Date;
  readonly startTime?: string;
  readonly endTime?: string;
  readonly isAvailable: boolean;
  readonly reason?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: AvailabilityOverrideProps) {
    AvailabilityOverride.validate(props);
    this.id = props.id;
    this.clinicId = props.clinicId;
    this.doctorId = props.doctorId;
    this.date = new Date(props.date.getTime());
    this.startTime = props.startTime;
    this.endTime = props.endTime;
    this.isAvailable = props.isAvailable;
    this.reason = props.reason;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  get isFullDayOff(): boolean {
    return !this.isAvailable && !this.startTime && !this.endTime;
  }

  private static validate(props: AvailabilityOverrideProps): void {
    if (
      props.startTime &&
      props.endTime &&
      props.endTime <= props.startTime
    ) {
      throw new InvalidAvailabilityOverrideError(
        `endTime (${props.endTime}) must be after startTime (${props.startTime})`,
      );
    }
  }
}
