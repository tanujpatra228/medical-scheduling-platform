import { Clinic } from "@msp/domain";

export interface IClinicRepository {
  findById(id: string): Promise<Clinic | null>;
  findBySlug(slug: string): Promise<Clinic | null>;
  save(clinic: Clinic): Promise<Clinic>;
  update(clinic: Clinic): Promise<Clinic>;
}
