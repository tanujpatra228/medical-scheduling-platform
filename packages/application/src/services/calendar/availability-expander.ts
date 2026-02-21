import { IAvailabilityRuleRepository } from "../../ports/repositories/availability-rule.repository.port";

export interface TimeWindow {
  startsAt: Date;
  endsAt: Date;
}

/**
 * Expands weekly availability rules into concrete time windows for a date range.
 * For each date in the range, looks up matching rules by day-of-week and creates
 * TimeWindow instances with actual dates.
 */
export class AvailabilityExpander {
  constructor(private readonly ruleRepo: IAvailabilityRuleRepository) {}

  async expand(
    clinicId: string,
    doctorId: string,
    from: Date,
    to: Date,
    _timezone: string,
  ): Promise<TimeWindow[]> {
    const rules = await this.ruleRepo.findByDoctorId(clinicId, doctorId);
    const windows: TimeWindow[] = [];

    const current = new Date(from);
    current.setHours(0, 0, 0, 0);

    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
      const dayOfWeek = current.getDay(); // 0=Sun, 6=Sat
      const matchingRules = rules.filter(
        (r) => r.dayOfWeek === dayOfWeek && r.isActive,
      );

      for (const rule of matchingRules) {
        const [startH, startM] = rule.startTime.split(":").map(Number);
        const [endH, endM] = rule.endTime.split(":").map(Number);

        const startsAt = new Date(current);
        startsAt.setHours(startH, startM, 0, 0);

        const endsAt = new Date(current);
        endsAt.setHours(endH, endM, 0, 0);

        windows.push({ startsAt, endsAt });
      }

      current.setDate(current.getDate() + 1);
    }

    return windows;
  }
}
