import { Email } from "../value-objects/email";
import { UserRole } from "@msp/shared";

export interface UserProps {
  id: string;
  clinicId: string;
  email: Email;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  readonly id: string;
  readonly clinicId: string;
  private _email: Email;
  private _passwordHash: string;
  private _firstName: string;
  private _lastName: string;
  readonly role: UserRole;
  private _phone?: string;
  private _isActive: boolean;
  readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.clinicId = props.clinicId;
    this._email = props.email;
    this._passwordHash = props.passwordHash;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this.role = props.role;
    this._phone = props.phone;
    this._isActive = props.isActive;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  get email(): Email {
    return this._email;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get fullName(): string {
    return `${this._firstName} ${this._lastName}`;
  }

  get phone(): string | undefined {
    return this._phone;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateProfile(
    props: Partial<{ firstName: string; lastName: string; phone: string }>,
  ): void {
    if (props.firstName !== undefined) this._firstName = props.firstName;
    if (props.lastName !== undefined) this._lastName = props.lastName;
    if (props.phone !== undefined) this._phone = props.phone;
    this._updatedAt = new Date();
  }

  updatePassword(newPasswordHash: string): void {
    this._passwordHash = newPasswordHash;
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
}
