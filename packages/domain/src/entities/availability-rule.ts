import { DomainError } from "../errors";

export class InvalidAvailabilityRuleError extends DomainError {
  readonly code = "INVALID_AVAILABILITY_RULE";

  constructor(message: string) {
    super(message);
  }
}

const MIN_DAY_OF_WEEK = 0;
const MAX_DAY_OF_WEEK = 6;

export interface AvailabilityRuleProps {
  id: string;
  clinicId: string;
  doctorId: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AvailabilityRule {
  readonly id: string;
  readonly clinicId: string;
  readonly doctorId: string;
  readonly dayOfWeek: number;
  private _startTime: string;
  private _endTime: string;
  private _isActive: boolean;
  readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: AvailabilityRuleProps) {
    AvailabilityRule.validate(props.dayOfWeek, props.startTime, props.endTime);
    this.id = props.id;
    this.clinicId = props.clinicId;
    this.doctorId = props.doctorId;
    this.dayOfWeek = props.dayOfWeek;
    this._startTime = props.startTime;
    this._endTime = props.endTime;
    this._isActive = props.isActive;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  get startTime(): string {
    return this._startTime;
  }

  get endTime(): string {
    return this._endTime;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  update(props: { startTime: string; endTime: string }): void {
    AvailabilityRule.validate(this.dayOfWeek, props.startTime, props.endTime);
    this._startTime = props.startTime;
    this._endTime = props.endTime;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  private static validate(
    dayOfWeek: number,
    startTime: string,
    endTime: string,
  ): void {
    if (dayOfWeek < MIN_DAY_OF_WEEK || dayOfWeek > MAX_DAY_OF_WEEK) {
      throw new InvalidAvailabilityRuleError(
        `dayOfWeek must be ${MIN_DAY_OF_WEEK}-${MAX_DAY_OF_WEEK}, got ${dayOfWeek}`,
      );
    }
    if (endTime <= startTime) {
      throw new InvalidAvailabilityRuleError(
        `endTime (${endTime}) must be after startTime (${startTime})`,
      );
    }
  }
}
