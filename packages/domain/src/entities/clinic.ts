import { Email } from "../value-objects/email";

export interface ClinicProps {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: Email;
  timezone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Clinic {
  readonly id: string;
  private _name: string;
  readonly slug: string;
  private _address: string;
  private _phone: string;
  private _email: Email;
  private _timezone: string;
  private _isActive: boolean;
  readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: ClinicProps) {
    this.id = props.id;
    this._name = props.name;
    this.slug = props.slug;
    this._address = props.address;
    this._phone = props.phone;
    this._email = props.email;
    this._timezone = props.timezone;
    this._isActive = props.isActive;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  get name(): string {
    return this._name;
  }

  get address(): string {
    return this._address;
  }

  get phone(): string {
    return this._phone;
  }

  get email(): Email {
    return this._email;
  }

  get timezone(): string {
    return this._timezone;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  update(
    props: Partial<{
      name: string;
      address: string;
      phone: string;
      email: Email;
      timezone: string;
    }>,
  ): void {
    if (props.name !== undefined) this._name = props.name;
    if (props.address !== undefined) this._address = props.address;
    if (props.phone !== undefined) this._phone = props.phone;
    if (props.email !== undefined) this._email = props.email;
    if (props.timezone !== undefined) this._timezone = props.timezone;
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
