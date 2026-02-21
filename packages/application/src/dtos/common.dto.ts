export interface PaginationDTO {
  readonly page: number;
  readonly limit: number;
}

export interface SortDTO {
  readonly field: string;
  readonly direction: "ASC" | "DESC";
}

export interface TenantContextDTO {
  readonly clinicId: string;
  readonly userId: string;
  readonly role: string;
}
