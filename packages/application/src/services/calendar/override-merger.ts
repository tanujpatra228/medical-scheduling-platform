import { AvailabilityOverride } from "@msp/domain";
import { IAvailabilityOverrideRepository } from "../../ports/repositories/availability-override.repository.port";
import { TimeWindow } from "./availability-expander";

/**
 * Applies availability overrides to expanded time windows.
 * - If override isAvailable=false (e.g. holiday/sick day): removes windows for that date
 * - If override isAvailable=true with custom times: replaces windows for that date
 */
export class OverrideMerger {
  constructor(
    private readonly overrideRepo: IAvailabilityOverrideRepository,
  ) {}

  async merge(
    clinicId: string,
    doctorId: string,
    from: Date,
    to: Date,
    windows: TimeWindow[],
  ): Promise<TimeWindow[]> {
    const overrides = await this.overrideRepo.findByDoctorAndDateRange(
      clinicId,
      doctorId,
      from,
      to,
    );

    if (overrides.length === 0) return windows;

    const overridesByDate = groupOverridesByDate(overrides);
    const result: TimeWindow[] = [];

    for (const window of windows) {
      const dateKey = toDateKey(window.startsAt);
      const dayOverrides = overridesByDate.get(dateKey);

      if (!dayOverrides) {
        result.push(window);
        continue;
      }

      const dayOff = dayOverrides.find((o) => !o.isAvailable);
      if (dayOff) continue;

      const timeOverrides = dayOverrides.filter(
        (o) => o.isAvailable && o.startTime && o.endTime,
      );

      if (timeOverrides.length > 0) {
        for (const override of timeOverrides) {
          const [startH, startM] = override.startTime!.split(":").map(Number);
          const [endH, endM] = override.endTime!.split(":").map(Number);

          const startsAt = new Date(window.startsAt);
          startsAt.setHours(startH, startM, 0, 0);

          const endsAt = new Date(window.startsAt);
          endsAt.setHours(endH, endM, 0, 0);

          result.push({ startsAt, endsAt });
        }
      } else {
        result.push(window);
      }
    }

    return result;
  }
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function groupOverridesByDate(
  overrides: AvailabilityOverride[],
): Map<string, AvailabilityOverride[]> {
  const map = new Map<string, AvailabilityOverride[]>();

  for (const override of overrides) {
    const dateKey = toDateKey(override.date);
    const existing = map.get(dateKey) ?? [];
    existing.push(override);
    map.set(dateKey, existing);
  }

  return map;
}
