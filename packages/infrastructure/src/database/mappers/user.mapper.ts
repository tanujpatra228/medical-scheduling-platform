import { User, UserProps, Email } from "@msp/domain";
import { UserRole } from "@msp/shared";
import { UserEntity, UserRoleEnum } from "../entities";

export class UserMapper {
  static toDomain(entity: UserEntity): User {
    const props: UserProps = {
      id: entity.id,
      clinicId: entity.clinicId,
      email: Email.create(entity.email),
      passwordHash: entity.passwordHash,
      firstName: entity.firstName,
      lastName: entity.lastName,
      role: entity.role as unknown as UserRole,
      phone: entity.phone ?? undefined,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
    return new User(props);
  }

  static toOrm(domain: User): Partial<UserEntity> {
    return {
      id: domain.id,
      clinicId: domain.clinicId,
      email: domain.email.toString(),
      passwordHash: domain.passwordHash,
      firstName: domain.firstName,
      lastName: domain.lastName,
      role: domain.role as unknown as UserRoleEnum,
      phone: domain.phone ?? null,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
