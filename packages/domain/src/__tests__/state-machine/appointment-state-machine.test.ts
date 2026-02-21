import { describe, it, expect } from "vitest";
import { AppointmentStateMachine } from "../../state-machine/appointment-state-machine";
import { AppointmentStatus } from "../../value-objects/appointment-status";
import { InvalidStateTransitionError } from "../../errors";

describe("AppointmentStateMachine", () => {
  describe("valid transitions", () => {
    it("should allow PENDING -> CONFIRMED", () => {
      const result = AppointmentStateMachine.transition(
        AppointmentStatus.PENDING,
        AppointmentStatus.CONFIRMED
      );
      expect(result).toBe(AppointmentStatus.CONFIRMED);
    });

    it("should allow CONFIRMED -> CANCELLED", () => {
      const result = AppointmentStateMachine.transition(
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CANCELLED
      );
      expect(result).toBe(AppointmentStatus.CANCELLED);
    });

    it("should allow CONFIRMED -> COMPLETED", () => {
      const result = AppointmentStateMachine.transition(
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.COMPLETED
      );
      expect(result).toBe(AppointmentStatus.COMPLETED);
    });

    it("should allow CONFIRMED -> NO_SHOW", () => {
      const result = AppointmentStateMachine.transition(
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.NO_SHOW
      );
      expect(result).toBe(AppointmentStatus.NO_SHOW);
    });
  });

  describe("invalid transitions", () => {
    it("should reject PENDING -> CANCELLED (must confirm first)", () => {
      expect(() =>
        AppointmentStateMachine.transition(
          AppointmentStatus.PENDING,
          AppointmentStatus.CANCELLED
        )
      ).toThrow(InvalidStateTransitionError);
    });

    it("should reject PENDING -> COMPLETED", () => {
      expect(() =>
        AppointmentStateMachine.transition(
          AppointmentStatus.PENDING,
          AppointmentStatus.COMPLETED
        )
      ).toThrow(InvalidStateTransitionError);
    });

    it("should reject PENDING -> NO_SHOW", () => {
      expect(() =>
        AppointmentStateMachine.transition(
          AppointmentStatus.PENDING,
          AppointmentStatus.NO_SHOW
        )
      ).toThrow(InvalidStateTransitionError);
    });

    it("should reject PENDING -> PENDING (self-transition)", () => {
      expect(() =>
        AppointmentStateMachine.transition(
          AppointmentStatus.PENDING,
          AppointmentStatus.PENDING
        )
      ).toThrow(InvalidStateTransitionError);
    });

    it("should reject CONFIRMED -> CONFIRMED (self-transition)", () => {
      expect(() =>
        AppointmentStateMachine.transition(
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.CONFIRMED
        )
      ).toThrow(InvalidStateTransitionError);
    });

    it("should reject CONFIRMED -> PENDING (backward transition)", () => {
      expect(() =>
        AppointmentStateMachine.transition(
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.PENDING
        )
      ).toThrow(InvalidStateTransitionError);
    });

    describe("terminal states cannot transition", () => {
      const terminalStates = [
        AppointmentStatus.CANCELLED,
        AppointmentStatus.COMPLETED,
        AppointmentStatus.NO_SHOW,
      ];

      const allStatuses = Object.values(AppointmentStatus);

      for (const terminal of terminalStates) {
        for (const target of allStatuses) {
          it(`should reject ${terminal} -> ${target}`, () => {
            expect(() =>
              AppointmentStateMachine.transition(terminal, target)
            ).toThrow(InvalidStateTransitionError);
          });
        }
      }
    });
  });

  describe("canTransition", () => {
    it("should return true for valid transitions", () => {
      expect(
        AppointmentStateMachine.canTransition(
          AppointmentStatus.PENDING,
          AppointmentStatus.CONFIRMED
        )
      ).toBe(true);
    });

    it("should return false for invalid transitions", () => {
      expect(
        AppointmentStateMachine.canTransition(
          AppointmentStatus.PENDING,
          AppointmentStatus.CANCELLED
        )
      ).toBe(false);
    });

    it("should return false for terminal state transitions", () => {
      expect(
        AppointmentStateMachine.canTransition(
          AppointmentStatus.CANCELLED,
          AppointmentStatus.PENDING
        )
      ).toBe(false);
    });
  });

  describe("getValidTransitions", () => {
    it("should return [CONFIRMED] for PENDING", () => {
      const transitions = AppointmentStateMachine.getValidTransitions(
        AppointmentStatus.PENDING
      );
      expect(transitions).toEqual([AppointmentStatus.CONFIRMED]);
    });

    it("should return [CANCELLED, COMPLETED, NO_SHOW] for CONFIRMED", () => {
      const transitions = AppointmentStateMachine.getValidTransitions(
        AppointmentStatus.CONFIRMED
      );
      expect(transitions).toContain(AppointmentStatus.CANCELLED);
      expect(transitions).toContain(AppointmentStatus.COMPLETED);
      expect(transitions).toContain(AppointmentStatus.NO_SHOW);
      expect(transitions).toHaveLength(3);
    });

    it("should return empty array for CANCELLED", () => {
      const transitions = AppointmentStateMachine.getValidTransitions(
        AppointmentStatus.CANCELLED
      );
      expect(transitions).toEqual([]);
    });

    it("should return empty array for COMPLETED", () => {
      const transitions = AppointmentStateMachine.getValidTransitions(
        AppointmentStatus.COMPLETED
      );
      expect(transitions).toEqual([]);
    });

    it("should return empty array for NO_SHOW", () => {
      const transitions = AppointmentStateMachine.getValidTransitions(
        AppointmentStatus.NO_SHOW
      );
      expect(transitions).toEqual([]);
    });
  });

  describe("isTerminalState", () => {
    it("should return true for CANCELLED", () => {
      expect(
        AppointmentStateMachine.isTerminalState(AppointmentStatus.CANCELLED)
      ).toBe(true);
    });

    it("should return true for COMPLETED", () => {
      expect(
        AppointmentStateMachine.isTerminalState(AppointmentStatus.COMPLETED)
      ).toBe(true);
    });

    it("should return true for NO_SHOW", () => {
      expect(
        AppointmentStateMachine.isTerminalState(AppointmentStatus.NO_SHOW)
      ).toBe(true);
    });

    it("should return false for PENDING", () => {
      expect(
        AppointmentStateMachine.isTerminalState(AppointmentStatus.PENDING)
      ).toBe(false);
    });

    it("should return false for CONFIRMED", () => {
      expect(
        AppointmentStateMachine.isTerminalState(AppointmentStatus.CONFIRMED)
      ).toBe(false);
    });
  });
});
