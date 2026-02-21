export interface CreateAvailabilityRuleDTO {
  readonly clinicId: string;
  readonly doctorId: string;
  readonly dayOfWeek: number;
  readonly startTime: string;
  readonly endTime: string;
}

export interface UpdateAvailabilityRuleDTO {
  readonly clinicId: string;
  readonly ruleId: string;
  readonly startTime: string;
  readonly endTime: string;
}

export interface CreateAvailabilityOverrideDTO {
  readonly clinicId: string;
  readonly doctorId: string;
  readonly date: string;
  readonly startTime?: string;
  readonly endTime?: string;
  readonly isAvailable: boolean;
  readonly reason?: string;
}

export interface AvailabilityRuleResponseDTO {
  readonly id: string;
  readonly doctorId: string;
  readonly dayOfWeek: number;
  readonly startTime: string;
  readonly endTime: string;
  readonly isActive: boolean;
}

export interface AvailabilityOverrideResponseDTO {
  readonly id: string;
  readonly doctorId: string;
  readonly date: string;
  readonly startTime?: string;
  readonly endTime?: string;
  readonly isAvailable: boolean;
  readonly reason?: string;
}
