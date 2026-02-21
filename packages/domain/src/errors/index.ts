export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidStateTransitionError extends DomainError {
  readonly code = "INVALID_STATE_TRANSITION";

  constructor(fromState: string, toState: string) {
    super(`Invalid state transition from "${fromState}" to "${toState}"`);
  }
}

export class SlotNotAvailableError extends DomainError {
  readonly code = "SLOT_NOT_AVAILABLE";

  constructor(
    message: string = "The requested time slot is not available"
  ) {
    super(message);
  }
}

export class DoubleBookingError extends DomainError {
  readonly code = "DOUBLE_BOOKING";

  constructor(doctorId: string, timeSlotDescription: string) {
    super(
      `Doctor ${doctorId} already has a booking during ${timeSlotDescription}`
    );
  }
}
