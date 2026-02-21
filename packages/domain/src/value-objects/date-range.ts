import { DomainError } from "../errors";

export class InvalidDateRangeError extends DomainError {
  readonly code = "INVALID_DATE_RANGE";

  constructor(message: string) {
    super(message);
  }
}

export class DateRange {
  readonly from: Date;
  readonly to: Date;

  private constructor(from: Date, to: Date) {
    this.from = from;
    this.to = to;
  }

  static create(from: Date, to: Date): DateRange {
    if (to <= from) {
      throw new InvalidDateRangeError(
        `End date (${to.toISOString()}) must be after start date (${from.toISOString()})`
      );
    }
    return new DateRange(new Date(from.getTime()), new Date(to.getTime()));
  }

  includes(date: Date): boolean {
    return date >= this.from && date <= this.to;
  }

  get durationDays(): number {
    return Math.ceil(
      (this.to.getTime() - this.from.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  overlapsWith(other: DateRange): boolean {
    return this.from < other.to && this.to > other.from;
  }
}
