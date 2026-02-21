import { Repository } from "typeorm";
import { ClinicEntity } from "../database/entities";
import { ClinicMapper } from "../database/mappers";
import { IClinicRepository } from "@msp/application";
import { Clinic } from "@msp/domain";

export class TypeOrmClinicRepository implements IClinicRepository {
  constructor(private readonly ormRepository: Repository<ClinicEntity>) {}

  async findById(id: string): Promise<Clinic | null> {
    const entity = await this.ormRepository.findOne({
      where: { id },
    });

    return entity ? ClinicMapper.toDomain(entity) : null;
  }

  async findBySlug(slug: string): Promise<Clinic | null> {
    const entity = await this.ormRepository.findOne({
      where: { slug },
    });

    return entity ? ClinicMapper.toDomain(entity) : null;
  }

  async save(clinic: Clinic): Promise<Clinic> {
    const ormData = ClinicMapper.toOrm(clinic);
    const savedEntity = await this.ormRepository.save(ormData);

    return ClinicMapper.toDomain(savedEntity as ClinicEntity);
  }

  async update(clinic: Clinic): Promise<Clinic> {
    const ormData = ClinicMapper.toOrm(clinic);
    const savedEntity = await this.ormRepository.save(ormData);

    return ClinicMapper.toDomain(savedEntity as ClinicEntity);
  }
}
