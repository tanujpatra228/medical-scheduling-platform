import { Repository, Between } from "typeorm";
import { AvailabilityOverrideEntity } from "../database/entities";
import { AvailabilityOverrideMapper } from "../database/mappers";
import { IAvailabilityOverrideRepository } from "@msp/application";
import { AvailabilityOverride } from "@msp/domain";

export class TypeOrmAvailabilityOverrideRepository
  implements IAvailabilityOverrideRepository
{
  constructor(
    private readonly ormRepository: Repository<AvailabilityOverrideEntity>,
  ) {}

  async findByDoctorAndDateRange(
    clinicId: string,
    doctorId: string,
    from: Date,
    to: Date,
  ): Promise<AvailabilityOverride[]> {
    const entities = await this.ormRepository.find({
      where: {
        clinicId,
        doctorId,
        date: Between(from, to),
      },
      order: { date: "ASC" },
    });

    return entities.map(AvailabilityOverrideMapper.toDomain);
  }

  async findByDoctorAndDate(
    clinicId: string,
    doctorId: string,
    date: Date,
  ): Promise<AvailabilityOverride[]> {
    const entities = await this.ormRepository.find({
      where: { clinicId, doctorId, date },
      order: { startTime: "ASC" },
    });

    return entities.map(AvailabilityOverrideMapper.toDomain);
  }

  async save(
    override: AvailabilityOverride,
  ): Promise<AvailabilityOverride> {
    const ormData = AvailabilityOverrideMapper.toOrm(override);
    const savedEntity = await this.ormRepository.save(ormData);

    return AvailabilityOverrideMapper.toDomain(
      savedEntity as AvailabilityOverrideEntity,
    );
  }

  async delete(clinicId: string, id: string): Promise<void> {
    await this.ormRepository.delete({ id, clinicId });
  }
}
