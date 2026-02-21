import { Clinic, ClinicProps, Email } from "@msp/domain";
import { ClinicEntity } from "../entities";

export class ClinicMapper {
  static toDomain(entity: ClinicEntity): Clinic {
    const props: ClinicProps = {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      address: entity.address,
      phone: entity.phone,
      email: Email.create(entity.email),
      timezone: entity.timezone,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
    return new Clinic(props);
  }

  static toOrm(domain: Clinic): Partial<ClinicEntity> {
    return {
      id: domain.id,
      name: domain.name,
      slug: domain.slug,
      address: domain.address,
      phone: domain.phone,
      email: domain.email.toString(),
      timezone: domain.timezone,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
