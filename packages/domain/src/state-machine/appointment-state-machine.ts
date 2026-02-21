import { AppointmentStatus } from "../value-objects/appointment-status";
import { InvalidStateTransitionError } from "../errors";

const TRANSITION_MAP: ReadonlyMap<
  AppointmentStatus,
  ReadonlySet<AppointmentStatus>
> = new Map([
  [AppointmentStatus.PENDING, new Set([AppointmentStatus.CONFIRMED])],
  [
    AppointmentStatus.CONFIRMED,
    new Set([
      AppointmentStatus.CANCELLED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.NO_SHOW,
    ]),
  ],
  [AppointmentStatus.CANCELLED, new Set<AppointmentStatus>()],
  [AppointmentStatus.COMPLETED, new Set<AppointmentStatus>()],
  [AppointmentStatus.NO_SHOW, new Set<AppointmentStatus>()],
]);

export class AppointmentStateMachine {
  static canTransition(
    from: AppointmentStatus,
    to: AppointmentStatus
  ): boolean {
    const validTransitions = TRANSITION_MAP.get(from);
    return validTransitions !== undefined && validTransitions.has(to);
  }

  static transition(
    from: AppointmentStatus,
    to: AppointmentStatus
  ): AppointmentStatus {
    if (!AppointmentStateMachine.canTransition(from, to)) {
      throw new InvalidStateTransitionError(from, to);
    }
    return to;
  }

  static getValidTransitions(
    from: AppointmentStatus
  ): ReadonlyArray<AppointmentStatus> {
    const validTransitions = TRANSITION_MAP.get(from);
    return validTransitions ? Array.from(validTransitions) : [];
  }

  static isTerminalState(status: AppointmentStatus): boolean {
    const validTransitions = TRANSITION_MAP.get(status);
    return validTransitions !== undefined && validTransitions.size === 0;
  }
}
