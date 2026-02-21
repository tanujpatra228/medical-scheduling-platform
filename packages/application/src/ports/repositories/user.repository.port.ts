import { User } from "@msp/domain";

export interface IUserRepository {
  findById(clinicId: string, id: string): Promise<User | null>;
  findByEmail(clinicId: string, email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
}
