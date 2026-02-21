import { DomainError } from "../errors";

export class InvalidTimeSlotError extends DomainError {
  readonly code = "INVALID_TIME_SLOT";

  constructor(message: string) {
    super(message);
  }
}

export class TimeSlot {
  readonly startsAt: Date;
  readonly endsAt: Date;

  private constructor(startsAt: Date, endsAt: Date) {
    this.startsAt = startsAt;
    this.endsAt = endsAt;
  }

  static create(startsAt: Date, endsAt: Date): TimeSlot {
    if (endsAt <= startsAt) {
      throw new InvalidTimeSlotError(
        `End time (${endsAt.toISOString()}) must be after start time (${startsAt.toISOString()})`
      );
    }
    return new TimeSlot(
      new Date(startsAt.getTime()),
      new Date(endsAt.getTime())
    );
  }

  get durationMinutes(): number {
    return (this.endsAt.getTime() - this.startsAt.getTime()) / (1000 * 60);
  }

  overlapsWith(other: TimeSlot): boolean {
    return this.startsAt < other.endsAt && this.endsAt > other.startsAt;
  }

  contains(other: TimeSlot): boolean {
    return this.startsAt <= other.startsAt && this.endsAt >= other.endsAt;
  }

  equals(other: TimeSlot): boolean {
    return (
      this.startsAt.getTime() === other.startsAt.getTime() &&
      this.endsAt.getTime() === other.endsAt.getTime()
    );
  }
}
