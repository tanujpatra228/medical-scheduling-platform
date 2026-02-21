import { Repository } from "typeorm";
import { AvailabilityRuleEntity } from "../database/entities";
import { AvailabilityRuleMapper } from "../database/mappers";
import { IAvailabilityRuleRepository } from "@msp/application";
import { AvailabilityRule } from "@msp/domain";

export class TypeOrmAvailabilityRuleRepository
  implements IAvailabilityRuleRepository
{
  constructor(
    private readonly ormRepository: Repository<AvailabilityRuleEntity>,
  ) {}

  async findByDoctorId(
    clinicId: string,
    doctorId: string,
  ): Promise<AvailabilityRule[]> {
    const entities = await this.ormRepository.find({
      where: { clinicId, doctorId, isActive: true },
      order: { dayOfWeek: "ASC", startTime: "ASC" },
    });

    return entities.map(AvailabilityRuleMapper.toDomain);
  }

  async findByDoctorAndDay(
    clinicId: string,
    doctorId: string,
    dayOfWeek: number,
  ): Promise<AvailabilityRule[]> {
    const entities = await this.ormRepository.find({
      where: { clinicId, doctorId, dayOfWeek, isActive: true },
      order: { startTime: "ASC" },
    });

    return entities.map(AvailabilityRuleMapper.toDomain);
  }

  async save(rule: AvailabilityRule): Promise<AvailabilityRule> {
    const ormData = AvailabilityRuleMapper.toOrm(rule);
    const savedEntity = await this.ormRepository.save(ormData);

    return AvailabilityRuleMapper.toDomain(
      savedEntity as AvailabilityRuleEntity,
    );
  }

  async update(rule: AvailabilityRule): Promise<AvailabilityRule> {
    const ormData = AvailabilityRuleMapper.toOrm(rule);
    const savedEntity = await this.ormRepository.save(ormData);

    return AvailabilityRuleMapper.toDomain(
      savedEntity as AvailabilityRuleEntity,
    );
  }

  async softDelete(clinicId: string, id: string): Promise<void> {
    await this.ormRepository.update(
      { id, clinicId },
      { isActive: false, updatedAt: new Date() },
    );
  }
}
