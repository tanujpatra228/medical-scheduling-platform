export interface PatientProps {
  id: string;
  userId: string;
  clinicId: string;
  dateOfBirth?: Date;
  insuranceNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Patient {
  readonly id: string;
  readonly userId: string;
  readonly clinicId: string;
  private _dateOfBirth?: Date;
  private _insuranceNumber?: string;
  private _notes?: string;
  readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: PatientProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.clinicId = props.clinicId;
    this._dateOfBirth = props.dateOfBirth;
    this._insuranceNumber = props.insuranceNumber;
    this._notes = props.notes;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  get dateOfBirth(): Date | undefined {
    return this._dateOfBirth;
  }

  get insuranceNumber(): string | undefined {
    return this._insuranceNumber;
  }

  get notes(): string | undefined {
    return this._notes;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateProfile(
    props: Partial<{
      dateOfBirth: Date;
      insuranceNumber: string;
      notes: string;
    }>,
  ): void {
    if (props.dateOfBirth !== undefined) this._dateOfBirth = props.dateOfBirth;
    if (props.insuranceNumber !== undefined)
      this._insuranceNumber = props.insuranceNumber;
    if (props.notes !== undefined) this._notes = props.notes;
    this._updatedAt = new Date();
  }
}
