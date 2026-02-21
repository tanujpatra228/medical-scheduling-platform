import { IDoctorRepository } from "../../ports/repositories/doctor.repository.port";
import { IClinicRepository } from "../../ports/repositories/clinic.repository.port";
import { AvailabilityExpander } from "../../services/calendar/availability-expander";
import { OverrideMerger } from "../../services/calendar/override-merger";
import { FreeSlotCalculator, Slot } from "../../services/calendar/free-slot-calculator";

const DEFAULT_TIMEZONE = "Europe/Berlin";

export class DoctorNotFoundError extends Error {
  constructor(doctorId: string) {
    super(`Doctor not found: ${doctorId}`);
  }
}

export class GetAvailableSlotsUseCase {
  constructor(
    private readonly doctorRepo: IDoctorRepository,
    private readonly clinicRepo: IClinicRepository,
    private readonly expander: AvailabilityExpander,
    private readonly merger: OverrideMerger,
    private readonly calculator: FreeSlotCalculator,
  ) {}

  async execute(
    clinicId: string,
    doctorId: string,
    from: Date,
    to: Date,
  ): Promise<Slot[]> {
    const doctor = await this.doctorRepo.findById(clinicId, doctorId);
    if (!doctor) throw new DoctorNotFoundError(doctorId);

    const clinic = await this.clinicRepo.findById(clinicId);
    const timezone = clinic?.timezone ?? DEFAULT_TIMEZONE;

    const windows = await this.expander.expand(
      clinicId,
      doctorId,
      from,
      to,
      timezone,
    );
    const merged = await this.merger.merge(
      clinicId,
      doctorId,
      from,
      to,
      windows,
    );
    const slots = await this.calculator.calculate(
      clinicId,
      doctorId,
      merged,
      doctor.slotDurationMin,
    );

    return slots;
  }
}
