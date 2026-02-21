import { DomainError } from "../errors";

export class InvalidEmailError extends DomainError {
  readonly code = "INVALID_EMAIL";

  constructor(email: string) {
    super(`Invalid email format: "${email}"`);
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_EMAIL_LENGTH = 5;

export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    const trimmed = email.trim().toLowerCase();
    if (!Email.isValid(trimmed)) {
      throw new InvalidEmailError(email);
    }
    return new Email(trimmed);
  }

  private static isValid(email: string): boolean {
    return EMAIL_REGEX.test(email) && email.length >= MIN_EMAIL_LENGTH;
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
