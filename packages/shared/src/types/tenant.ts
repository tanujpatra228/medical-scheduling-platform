export interface TenantContext {
  readonly clinicId: string;
  readonly userId: string;
  readonly role: UserRole;
}

export enum UserRole {
  CLINIC_ADMIN = "CLINIC_ADMIN",
  DOCTOR = "DOCTOR",
  PATIENT = "PATIENT",
}
